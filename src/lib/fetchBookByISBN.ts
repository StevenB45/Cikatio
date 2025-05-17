// Utilitaire pour récupérer les informations d'un livre à partir d'un ISBN
// Interroge successivement la BNF, Google Books puis Open Library

export interface BookInfo {
  title: string;
  author: string;
  publisher: string;
  yearPublished?: number;
  cover: string;
  description: string;
}

export async function fetchBookByISBN(isbn: string): Promise<BookInfo | null> {
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');

  // Helper pour parser l'année
  const parseYear = (str?: string) => str ? parseInt(str.match(/\d{4}/)?.[0] || '') : undefined;

  // 1. BNF
  try {
    const res = await fetch(`https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=isbn%3D${cleanIsbn}&recordSchema=dc`);
    if (res.ok) {
      const xml = await res.text();
      const title = xml.match(/<dc:title>([^<]+)<\/dc:title>/)?.[1] || '';
      if (title) {
        return {
          title,
          author: xml.match(/<dc:creator>([^<]+)<\/dc:creator>/)?.[1] || '',
          publisher: xml.match(/<dc:publisher>([^<]+)<\/dc:publisher>/)?.[1] || '',
          yearPublished: parseYear(xml.match(/<dc:date>([^<]+)<\/dc:date>/)?.[1]),
          cover: '',
          description: xml.match(/<dc:description>([^<]+)<\/dc:description>/)?.[1] || '',
        };
      }
    }
  } catch {}

  // 2. Google Books
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
    if (res.ok) {
      const data = await res.json();
      const info = data.totalItems > 0 ? data.items?.[0]?.volumeInfo : null;
      if (info) {
        return {
          title: info.title || '',
          author: info.authors?.[0] || '',
          publisher: info.publisher || '',
          yearPublished: parseYear(info.publishedDate),
          cover: info.imageLinks?.thumbnail || '',
          description: info.description || '',
        };
      }
    }
  } catch {}

  // 3. Open Library
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
    if (res.ok) {
      const data = await res.json();
      const book = data[`ISBN:${cleanIsbn}`];
      if (book) {
        return {
          title: book.title || '',
          author: book.authors?.[0]?.name || '',
          publisher: Array.isArray(book.publishers)
            ? (typeof book.publishers[0] === 'string' ? book.publishers[0] : book.publishers[0]?.name) || '' : '',
          yearPublished: parseYear(book.publish_date),
          cover: book.cover?.medium || '',
          description: typeof book.description === 'string' ? book.description : book.description?.value || '',
        };
      }
    }
  } catch {}

  return null;
}
