import { NextResponse } from 'next/server';
import { fetchBookByISBN } from '@/lib/fetchBookByISBN';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get('isbn');
  if (!isbn) {
    return NextResponse.json({ error: 'ISBN manquant' }, { status: 400 });
  }
  try {
    const book = await fetchBookByISBN(isbn);
    if (!book) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(book);
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur lors de la récupération du livre' }, { status: 500 });
  }
}