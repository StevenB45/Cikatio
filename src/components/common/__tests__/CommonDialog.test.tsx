import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommonDialog from '../CommonDialog';

describe('CommonDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    title: 'Test Dialog',
    children: <div>Test Content</div>
  };

  it('devrait rendre le dialogue avec les props par défaut', () => {
    render(<CommonDialog {...defaultProps} />);
    
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Confirmer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('devrait appeler onClose lors du clic sur Annuler', () => {
    render(<CommonDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Annuler'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('devrait appeler onConfirm lors du clic sur Confirmer', () => {
    const onConfirm = jest.fn();
    render(<CommonDialog {...defaultProps} onConfirm={onConfirm} />);
    
    fireEvent.click(screen.getByText('Confirmer'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('devrait désactiver les boutons pendant le chargement', () => {
    render(<CommonDialog {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Confirmer')).toBeDisabled();
    expect(screen.getByText('Annuler')).toBeDisabled();
  });

  it('devrait afficher un message personnalisé', () => {
    const message = 'Message personnalisé';
    render(<CommonDialog {...defaultProps} message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('devrait utiliser les actions personnalisées', () => {
    const customActions = <button>Action personnalisée</button>;
    render(<CommonDialog {...defaultProps} actions={customActions} />);
    
    expect(screen.getByText('Action personnalisée')).toBeInTheDocument();
    expect(screen.queryByText('Confirmer')).not.toBeInTheDocument();
    expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
  });

  it('devrait changer la couleur du bouton selon la sévérité', () => {
    const { rerender } = render(<CommonDialog {...defaultProps} severity="error" />);
    expect(screen.getByText('Confirmer')).toHaveClass('MuiButton-colorError');

    rerender(<CommonDialog {...defaultProps} severity="warning" />);
    expect(screen.getByText('Confirmer')).toHaveClass('MuiButton-colorWarning');

    rerender(<CommonDialog {...defaultProps} severity="success" />);
    expect(screen.getByText('Confirmer')).toHaveClass('MuiButton-colorSuccess');
  });
}); 