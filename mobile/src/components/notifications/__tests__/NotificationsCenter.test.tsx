/**
 * Tests for NotificationsCenter Component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NotificationsCenter } from '../NotificationsCenter';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;
const mockUseAuth = useAuth as jest.Mock;

const alertMock = Alert.alert as jest.Mock;

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

const mockNotifications = [
  {
    id: '1',
    type: 'report',
    title: 'New Report',
    message: 'A new scouting report has been created',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'match',
    title: 'Match Reminder',
    message: 'Match starts in 1 hour',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe('NotificationsCenter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    alertMock.mockClear();
  });

  it('should render correctly when visible', () => {
    mockedApi.getNotifications.mockResolvedValue([]);

    const { getByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    expect(getByText('Notifications')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <NotificationsCenter visible={false} onClose={jest.fn()} />
    );

    expect(queryByText('Notifications')).toBeNull();
  });

  it('should fetch notifications on mount when visible', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);

    render(<NotificationsCenter visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(mockedApi.getNotifications).toHaveBeenCalledTimes(1);
    });
  });

  it('should display notifications list', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const notification1 = await findByText('New Report');
    const notification2 = await findByText('Match Reminder');

    expect(notification1).toBeTruthy();
    expect(notification2).toBeTruthy();
  });

  it('should show unread count', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const unreadCount = await findByText('1 unread');
    expect(unreadCount).toBeTruthy();
  });

  it('should mark notification as read when pressed', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);
    mockedApi.markNotificationAsRead.mockResolvedValue({});

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const unreadNotification = await findByText('New Report');
    fireEvent.press(unreadNotification);

    await waitFor(() => {
      expect(mockedApi.markNotificationAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('should show "Mark all read" button when there are unread notifications', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const markAllButton = await findByText('Mark all read');
    expect(markAllButton).toBeTruthy();
  });

  it('should mark all notifications as read', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);
    mockedApi.markNotificationAsRead.mockResolvedValue({});

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const markAllButton = await findByText('Mark all read');
    fireEvent.press(markAllButton);

    await waitFor(() => {
      expect(mockedApi.markNotificationAsRead).toHaveBeenCalledWith('1');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        '1 notifications marked as read'
      );
    });
  });

  it('should delete notification after confirmation', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);
    mockedApi.deleteNotification.mockResolvedValue({});

    // Mock Alert.alert to auto-confirm
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find((b: any) => b.text === 'Delete');
      if (deleteButton && deleteButton.onPress) {
        deleteButton.onPress();
      }
    });

    const { findAllByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    await waitFor(async () => {
      const deleteButtons = await findAllByText('🗑️');
      fireEvent.press(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(mockedApi.deleteNotification).toHaveBeenCalledWith('1');
    });
  });

  it('should clear all notifications after confirmation', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);
    mockedApi.deleteNotification.mockResolvedValue({});

    // Mock Alert.alert to auto-confirm
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const clearButton = buttons?.find((b: any) => b.text === 'Clear All');
      if (clearButton && clearButton.onPress) {
        clearButton.onPress();
      }
    });

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const clearAllButton = await findByText('Clear all');
    fireEvent.press(clearAllButton);

    await waitFor(() => {
      expect(mockedApi.deleteNotification).toHaveBeenCalledTimes(2);
    });
  });

  it('should display empty state when no notifications', async () => {
    mockedApi.getNotifications.mockResolvedValue([]);

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    const emptyText = await findByText('No notifications');
    const emptySubtext = await findByText("You're all caught up!");

    expect(emptyText).toBeTruthy();
    expect(emptySubtext).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    mockedApi.getNotifications.mockRejectedValue(new Error('Network error'));

    const { findByText } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    // Should show empty state instead of crashing
    const emptyText = await findByText('No notifications');
    expect(emptyText).toBeTruthy();
  });

  it('should refresh notifications on pull-to-refresh', async () => {
    mockedApi.getNotifications.mockResolvedValue(mockNotifications);

    const { getByTestId } = render(
      <NotificationsCenter visible={true} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockedApi.getNotifications).toHaveBeenCalledTimes(1);
    });

    // Simulate refresh by finding RefreshControl and calling onRefresh
    const scrollView = getByTestId('notifications-scroll-view');
    const { refreshControl } = scrollView.props;

    if (refreshControl && refreshControl.props.onRefresh) {
      refreshControl.props.onRefresh();
    }

    await waitFor(() => {
      expect(mockedApi.getNotifications).toHaveBeenCalledTimes(2);
    });
  });
});
