/**
 * LogConsoleScreen
 *
 * In-app log viewer for debugging and monitoring
 * Features:
 * - View real-time logs
 * - Filter by tag (API, NAVIGATION, ERROR, etc.)
 * - Search logs
 * - Export logs
 * - Clear logs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../../services/logger.service';
import type { LogTag } from '../../logging/expoLogBridge';

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  data?: any;
}

const LOG_LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'] as const;
const LOG_TAGS: LogTag[] = ['API', 'NAVIGATION', 'UI', 'AI', 'ERROR', 'AUTH', 'DATA', 'PERFORMANCE', 'USER_ACTION', 'SYSTEM'];

export function LogConsoleScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Load logs from logger service
  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter logs when filters change
  useEffect(() => {
    filterLogs();
  }, [logs, selectedLevel, selectedTag, searchQuery]);

  const loadLogs = async () => {
    const inMemoryLogs = logger.getInMemoryLogs();
    setLogs(inMemoryLogs as LogEntry[]);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by level
    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filter by tag (context)
    if (selectedTag !== 'ALL') {
      filtered = filtered.filter(log => log.context === selectedTag);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.context.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleExportLogs = async () => {
    try {
      const logContent = await logger.getLogFileContent();

      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arcane-logs-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For mobile, use Share
        await Share.share({
          message: logContent,
          title: 'Arcane Logs',
        });
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export logs');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await logger.clearLogs();
            setLogs([]);
            setFilteredLogs([]);
          },
        },
      ]
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
      case 'FATAL':
        return '#ff4444';
      case 'WARN':
        return '#ffaa00';
      case 'INFO':
        return '#4CAF50';
      case 'DEBUG':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    const levelColor = getLevelColor(item.level);

    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <Text style={[styles.logLevel, { color: levelColor }]}>
            [{item.level}]
          </Text>
          <Text style={styles.logTag}>[{item.context}]</Text>
          <Text style={styles.logTimestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <Text style={styles.logMessage}>{item.message}</Text>
        {item.data && (
          <Text style={styles.logData}>
            {typeof item.data === 'string' ? item.data : JSON.stringify(item.data, null, 2)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Log Console</Text>
        <Text style={styles.count}>{filteredLogs.length} logs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Level Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Level:</Text>
        <View style={styles.filterButtons}>
          {LOG_LEVELS.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                selectedLevel === level && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedLevel === level && styles.filterButtonTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tag Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Tag:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedTag === 'ALL' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedTag('ALL')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedTag === 'ALL' && styles.filterButtonTextActive,
              ]}
            >
              ALL
            </Text>
          </TouchableOpacity>
          {LOG_TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterButton,
                selectedTag === tag && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedTag === tag && styles.filterButtonTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        style={styles.logsList}
        contentContainerStyle={styles.logsListContent}
        inverted={false}
        onContentSizeChange={() => {
          if (autoScroll) {
            // Auto-scroll to bottom
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs to display</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedLevel !== 'ALL' || selectedTag !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Logs will appear as you use the app'}
            </Text>
          </View>
        }
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleClearLogs}
        >
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={handleExportLogs}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  count: {
    fontSize: 14,
    color: '#999',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  logsList: {
    flex: 1,
  },
  logsListContent: {
    padding: 16,
  },
  logItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#444',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logTag: {
    fontSize: 11,
    color: '#4CAF50',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#666',
    marginLeft: 'auto',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logMessage: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logData: {
    fontSize: 11,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  actionButtonSecondary: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  actionButtonTextPrimary: {
    color: '#fff',
  },
});

export default LogConsoleScreen;
