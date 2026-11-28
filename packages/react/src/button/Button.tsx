import type { ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { textStyles } from '@updown/tokens';
import type { PropValue } from '@updown/contracts';
import contract from './Button.contract.json';
import styles from './Button.module.css';

// Prop types and defaults come from the contract, so code and contract can't disagree.
export type ButtonAppearance = PropValue<typeof contract, 'appearance'>;
export type ButtonVariant = PropValue<typeof contract, 'variant'>;
export type ButtonSize = PropValue<typeof contract, 'size'>;

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  /** Emphasis. */
  appearance?: ButtonAppearance;
  /** Colour role. Use inverse only on surface/inverse backgrounds. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label. Decorative: it is hidden from assistive technology. */
  leadingIcon?: ReactNode;
  /** Icon after the label. Decorative: it is hidden from assistive technology. */
  trailingIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const LABEL_STYLE: Record<ButtonSize, string> = {
  small: textStyles['Label/Small'],
  medium: textStyles['Label/Medium'],
  large: textStyles['Label/Large'],
};

export function Button({
  appearance = contract.props.appearance.default,
  variant = contract.props.variant.default,
  size = contract.props.size.default,
  leadingIcon,
  trailingIcon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <AriaButton
      {...rest}
      className={[styles.button, LABEL_STYLE[size], className].filter(Boolean).join(' ')}
      data-appearance={appearance}
      data-variant={variant}
      data-size={size}
      // Inverse sits on a background that stays dark in both themes, so it keeps Light mode.
      data-theme={variant === 'inverse' ? 'light' : undefined}
    >
      {leadingIcon != null && <span className={styles.icon} aria-hidden="true">{leadingIcon}</span>}
      {children != null && <span>{children}</span>}
      {trailingIcon != null && <span className={styles.icon} aria-hidden="true">{trailingIcon}</span>}
    </AriaButton>
  );
}
