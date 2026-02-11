import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import { colors, typography } from '../../design/theme';

interface AnimatedCounterProps {
  to: number;
  from?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  style?: TextStyle;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  to,
  from = 0,
  duration = 2000,
  suffix = '',
  prefix = '',
  style,
}) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const steps = 60;
    const increment = (to - from) / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(from + increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [to, from, duration]);

  return (
    <Text style={[{ fontSize: typography.sizes.h3, fontWeight: '900', color: colors.text.primary }, style]}>
      {prefix}{count}{suffix}
    </Text>
  );
};
