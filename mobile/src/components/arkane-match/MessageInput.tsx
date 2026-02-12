import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, radius } from '../../design/theme';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = 'Ask me anything about scouts...',
}) => {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setInput('');
    setInputHeight(44); // Reset height
  };

  const handleContentSizeChange = (e: any) => {
    const newHeight = e.nativeEvent.contentSize.height;
    // Limit height between 44 and 120
    setInputHeight(Math.max(44, Math.min(120, newHeight)));
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { height: Math.max(44, inputHeight) }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          multiline
          maxLength={500}
          editable={!isLoading}
          onContentSizeChange={handleContentSizeChange}
          returnKeyType="send"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          !canSend && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.background.primary} />
        ) : (
          <View style={styles.sendIcon}>
            <SendIcon />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Simple Send Icon Component
const SendIcon = () => (
  <View style={styles.iconContainer}>
    <View style={styles.iconArrow} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.sm + 2, // Adjust for multiline
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    width: 20,
    height: 20,
  },
  iconArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.background.primary,
    transform: [{ rotate: '90deg' }],
  },
});
