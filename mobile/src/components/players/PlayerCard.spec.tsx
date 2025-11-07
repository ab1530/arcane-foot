import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PlayerCard } from './PlayerCard';
import { Player, PlayerStatus } from '../../types';

describe('PlayerCard', () => {
  const mockPlayer: Player = {
    id: 'player1',
    userId: 'user1',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'avatar1.jpg',
    },
    position: 'FORWARD',
    height: 180,
    weight: 75,
    preferredFoot: 'Right',
    nationality: 'USA',
    dateOfBirth: '1995-01-15',
    status: PlayerStatus.ACTIVE,
    marketValue: 5000000,
    statsJson: { overall: 85, rating: 85 },
    clubId: 'club1',
    club: {
      id: 'club1',
      name: 'FC Barcelona',
      country: 'Spain',
    },
  };

  describe('Rendering', () => {
    it('should render player information correctly', () => {
      render(<PlayerCard player={mockPlayer} testID="player-card" />);

      expect(screen.getByTestId('player-card-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('player-card-position')).toHaveTextContent('FORWARD');
      expect(screen.getByTestId('player-card-club')).toHaveTextContent('FC Barcelona');
      expect(screen.getByTestId('player-card-rating')).toHaveTextContent('85.0');
      expect(screen.getByTestId('player-card-value')).toHaveTextContent('€5.0M');
    });

    it('should render player initial correctly', () => {
      render(<PlayerCard player={mockPlayer} testID="player-card" />);

      expect(screen.getByTestId('player-card-initial')).toHaveTextContent('J');
    });

    it('should calculate and display player age', () => {
      render(<PlayerCard player={mockPlayer} testID="player-card" />);

      const ageElement = screen.getByTestId('player-card-age');
      expect(ageElement).toBeTruthy();
      expect(ageElement.children[0]).toMatch(/\d+ yrs/);
    });

    it('should handle missing user data', () => {
      const playerWithoutUser = {
        ...mockPlayer,
        user: {
          firstName: '',
          lastName: '',
        },
      };

      render(<PlayerCard player={playerWithoutUser} testID="player-card" />);

      expect(screen.getByTestId('player-card-name')).toHaveTextContent('Unknown Player');
    });

    it('should handle missing club data', () => {
      const playerWithoutClub = {
        ...mockPlayer,
        club: undefined,
      };

      render(<PlayerCard player={playerWithoutClub} testID="player-card" />);

      expect(screen.getByTestId('player-card-club')).toHaveTextContent('Free Agent');
    });

    it('should handle missing position', () => {
      const playerWithoutPosition = {
        ...mockPlayer,
        position: '',
      };

      render(<PlayerCard player={playerWithoutPosition} testID="player-card" />);

      expect(screen.getByTestId('player-card-position')).toHaveTextContent('N/A');
    });

    it('should handle missing market value', () => {
      const playerWithoutValue = {
        ...mockPlayer,
        marketValue: undefined,
      };

      render(<PlayerCard player={playerWithoutValue} testID="player-card" />);

      expect(screen.getByTestId('player-card-value')).toHaveTextContent('N/A');
    });

    it('should handle missing date of birth', () => {
      const playerWithoutDOB = {
        ...mockPlayer,
        dateOfBirth: '',
      };

      render(<PlayerCard player={playerWithoutDOB} testID="player-card" />);

      expect(screen.queryByTestId('player-card-age')).toBeNull();
    });

    it('should handle missing stats', () => {
      const playerWithoutStats = {
        ...mockPlayer,
        statsJson: undefined,
      };

      render(<PlayerCard player={playerWithoutStats} testID="player-card" />);

      expect(screen.getByTestId('player-card-rating')).toHaveTextContent('75');
    });
  });

  describe('Market Value Formatting', () => {
    it('should format millions correctly', () => {
      const player = { ...mockPlayer, marketValue: 12500000 };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-value')).toHaveTextContent('€12.5M');
    });

    it('should format thousands correctly', () => {
      const player = { ...mockPlayer, marketValue: 750000 };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-value')).toHaveTextContent('€750K');
    });

    it('should format small values correctly', () => {
      const player = { ...mockPlayer, marketValue: 500 };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-value')).toHaveTextContent('€500');
    });
  });

  describe('Rating Display', () => {
    it('should display overall rating when available', () => {
      const player = {
        ...mockPlayer,
        statsJson: { overall: 92.5 },
      };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-rating')).toHaveTextContent('92.5');
    });

    it('should display rating when overall is not available', () => {
      const player = {
        ...mockPlayer,
        statsJson: { rating: 78.3 },
      };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-rating')).toHaveTextContent('78.3');
    });

    it('should default to 75 when no stats available', () => {
      const player = {
        ...mockPlayer,
        statsJson: null,
      };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-rating')).toHaveTextContent('75');
    });
  });

  describe('Interactions', () => {
    it('should call onPress with player id when pressed', () => {
      const onPress = jest.fn();
      render(<PlayerCard player={mockPlayer} onPress={onPress} testID="player-card" />);

      const card = screen.getByTestId('player-card');
      fireEvent.press(card);

      expect(onPress).toHaveBeenCalledWith('player1');
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onPress is not provided', () => {
      render(<PlayerCard player={mockPlayer} testID="player-card" />);

      const card = screen.getByTestId('player-card');
      expect(() => {
        fireEvent.press(card);
      }).not.toThrow();
    });

    it('should support multiple presses', () => {
      const onPress = jest.fn();
      render(<PlayerCard player={mockPlayer} onPress={onPress} testID="player-card" />);

      const card = screen.getByTestId('player-card');
      fireEvent.press(card);
      fireEvent.press(card);
      fireEvent.press(card);

      expect(onPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = render(
        <PlayerCard player={mockPlayer} testID="player-card" />
      );

      expect(getByLabelText('Player card for John Doe')).toBeTruthy();
    });

    it('should be accessible', () => {
      const { getByTestId } = render(
        <PlayerCard player={mockPlayer} testID="player-card" />
      );

      const card = getByTestId('player-card');
      expect(card.props.accessible).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle player with only firstName', () => {
      const player = {
        ...mockPlayer,
        user: {
          firstName: 'John',
          lastName: '',
        },
      };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-name')).toHaveTextContent('John');
    });

    it('should handle player with only lastName', () => {
      const player = {
        ...mockPlayer,
        user: {
          firstName: '',
          lastName: 'Doe',
        },
      };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-name')).toHaveTextContent('Doe');
    });

    it('should handle player born in leap year', () => {
      const player = {
        ...mockPlayer,
        dateOfBirth: '2000-02-29',
      };
      render(<PlayerCard player={player} testID="player-card" />);

      const ageElement = screen.getByTestId('player-card-age');
      expect(ageElement).toBeTruthy();
    });

    it('should handle player birthday today', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const player = {
        ...mockPlayer,
        dateOfBirth: `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      };
      render(<PlayerCard player={player} testID="player-card" />);

      expect(screen.getByTestId('player-card-age')).toHaveTextContent('25 yrs');
    });
  });
});
