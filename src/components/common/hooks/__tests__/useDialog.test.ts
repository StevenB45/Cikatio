import { renderHook, act } from '@testing-library/react';
import { useDialog } from '../useDialog';

describe('useDialog', () => {
  it('devrait initialiser avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useDialog());
    
    expect(result.current.open).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('devrait ouvrir le dialogue', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.handleOpen();
    });
    
    expect(result.current.open).toBe(true);
  });

  it('devrait fermer le dialogue', () => {
    const onCancel = jest.fn();
    const { result } = renderHook(() => useDialog({ onCancel }));
    
    act(() => {
      result.current.handleOpen();
      result.current.handleClose();
    });
    
    expect(result.current.open).toBe(false);
    expect(onCancel).toHaveBeenCalled();
  });

  it('ne devrait pas fermer le dialogue pendant le chargement', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.handleOpen();
      result.current.loading = true;
      result.current.handleClose();
    });
    
    expect(result.current.open).toBe(true);
  });

  it('devrait gérer la confirmation avec succès', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDialog({ onConfirm }));
    
    await act(async () => {
      result.current.handleOpen();
      await result.current.handleConfirm();
    });
    
    expect(onConfirm).toHaveBeenCalled();
    expect(result.current.open).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs de confirmation', async () => {
    const error = new Error('Test error');
    const onConfirm = jest.fn().mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useDialog({ onConfirm }));
    
    await act(async () => {
      result.current.handleOpen();
      await result.current.handleConfirm();
    });
    
    expect(onConfirm).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error in dialog confirmation:', error);
    expect(result.current.open).toBe(true);
    expect(result.current.loading).toBe(false);
    
    consoleSpy.mockRestore();
  });
}); 