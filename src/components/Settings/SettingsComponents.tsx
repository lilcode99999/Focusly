import React, { useState, useId } from 'react';
import './SettingsComponents.css';

// Base interfaces
interface BaseSettingProps {
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

// Settings Section Container
interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  const titleId = useId();
  const descId = useId();

  return (
    <section
      className={`settings-section ${className}`}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <div className="settings-section-header">
        <h3 id={titleId} className="settings-section-title">
          {title}
        </h3>
        {description && (
          <p id={descId} className="settings-section-description">
            {description}
          </p>
        )}
      </div>
      <div className="settings-section-content">
        {children}
      </div>
    </section>
  );
};

// Settings Card Wrapper
interface SettingsCardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  children,
  className = '',
  highlight = false,
}) => (
  <div className={`settings-card ${highlight ? 'settings-card--highlight' : ''} ${className}`}>
    {children}
  </div>
);

// Toggle Switch Component
interface SettingsToggleProps extends BaseSettingProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  const toggleId = useId();
  const descId = useId();

  return (
    <div className={`settings-item settings-toggle ${className}`}>
      <div className="settings-item-info">
        <label htmlFor={toggleId} className="settings-label">
          {label}
        </label>
        {description && (
          <p id={descId} className="settings-description">
            {description}
          </p>
        )}
      </div>
      <div className="settings-item-control">
        <button
          id={toggleId}
          role="switch"
          aria-checked={checked}
          aria-describedby={description ? descId : undefined}
          className={`toggle-switch ${checked ? 'toggle-switch--on' : 'toggle-switch--off'}`}
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
        >
          <span className="toggle-switch-slider" />
          <span className="sr-only">
            {checked ? 'Enabled' : 'Disabled'}
          </span>
        </button>
      </div>
    </div>
  );
};

// Slider Component
interface SettingsSliderProps extends BaseSettingProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatLabel?: (value: number) => string;
  formatValue?: (value: number) => string;
  showMarkers?: boolean;
  unit?: string;
}

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  formatLabel,
  formatValue,
  showMarkers = false,
  disabled = false,
  className = '',
  unit = '',
}) => {
  const sliderId = useId();
  const descId = useId();
  const displayValue = formatValue ? formatValue(value) : formatLabel ? formatLabel(value) : `${value}${unit ? ' ' + unit : ''}`;

  return (
    <div className={`settings-item settings-slider ${className}`}>
      <div className="settings-item-info">
        <label htmlFor={sliderId} className="settings-label">
          {label}: <span className="settings-value">{displayValue}</span>
        </label>
        {description && (
          <p id={descId} className="settings-description">
            {description}
          </p>
        )}
      </div>
      <div className="settings-item-control">
        <div className="slider-container">
          <input
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="slider-input"
            aria-describedby={description ? descId : undefined}
          />
          {showMarkers && (
            <div className="slider-markers">
              <span className="slider-marker">{min}</span>
              <span className="slider-marker">{max}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Select Component
interface SettingsSelectProps extends BaseSettingProps {
  value: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange: (value: string) => void;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
  className = '',
}) => {
  const selectId = useId();
  const descId = useId();

  return (
    <div className={`settings-item settings-select ${className}`}>
      <div className="settings-item-info">
        <label htmlFor={selectId} className="settings-label">
          {label}
        </label>
        {description && (
          <p id={descId} className="settings-description">
            {description}
          </p>
        )}
      </div>
      <div className="settings-item-control">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="select-input"
          aria-describedby={description ? descId : undefined}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Input Component
interface SettingsInputProps extends BaseSettingProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'number';
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  multiline = false,
  disabled = false,
  className = '',
}) => {
  const inputId = useId();
  const descId = useId();

  return (
    <div className={`settings-item settings-input ${className}`}>
      <div className="settings-item-info">
        <label htmlFor={inputId} className="settings-label">
          {label}
        </label>
        {description && (
          <p id={descId} className="settings-description">
            {description}
          </p>
        )}
      </div>
      <div className="settings-item-control">
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="text-input"
            aria-describedby={description ? descId : undefined}
            rows={4}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="text-input"
            aria-describedby={description ? descId : undefined}
          />
        )}
      </div>
    </div>
  );
};

// Alias for backwards compatibility
export const SettingsTextInput = SettingsInput;

// Secure Input Component (for API keys)
interface SecureInputProps extends BaseSettingProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTestButton?: boolean;
  onTest?: () => Promise<boolean>;
  testResult?: { status: 'idle' | 'testing' | 'success' | 'error'; message?: string };
}

export const SecureInput: React.FC<SecureInputProps> = ({
  label,
  description,
  value,
  onChange,
  placeholder,
  showTestButton = false,
  onTest,
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const inputId = useId();
  const descId = useId();

  const maskedValue = value ? `${'•'.repeat(8)}${value.slice(-4)}` : '';
  const displayValue = isVisible ? value : maskedValue;

  const handleTest = async () => {
    if (!onTest || !value) return;

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await onTest();
      setTestResult(result ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className={`settings-item settings-secure-input ${className}`}>
      <div className="settings-item-info">
        <label htmlFor={inputId} className="settings-label">
          {label}
        </label>
        {description && (
          <p id={descId} className="settings-description">
            {description}
          </p>
        )}
      </div>
      <div className="settings-item-control">
        <div className="secure-input-container">
          <input
            id={inputId}
            type={isVisible ? 'text' : 'password'}
            value={isVisible ? value : displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="secure-input"
            aria-describedby={description ? descId : undefined}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
          />
          <button
            type="button"
            className="secure-input-toggle"
            onClick={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? 'Hide API key' : 'Show API key'}
            disabled={disabled || !value}
          >
            {isVisible ? '👁️' : '👁️‍🗨️'}
          </button>
          {showTestButton && value && (
            <button
              type="button"
              className={`secure-input-test ${testResult ? `test-${testResult}` : ''}`}
              onClick={handleTest}
              disabled={disabled || isTestingConnection || !value}
              aria-label="Test connection"
            >
              {isTestingConnection ? '⏳' : testResult === 'success' ? '✅' : testResult === 'error' ? '❌' : '🔍'}
            </button>
          )}
        </div>
        {testResult && (
          <div className={`test-result test-result--${testResult}`}>
            {testResult === 'success' ? '✅ Connection successful' : '❌ Connection failed'}
          </div>
        )}
      </div>
    </div>
  );
};

// Button Group Component
interface SettingsButtonGroupProps extends BaseSettingProps {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value: string;
  onChange: (value: string) => void;
}

export const SettingsButtonGroup: React.FC<SettingsButtonGroupProps> = ({
  label,
  description,
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const groupId = useId();
  const descId = useId();

  return (
    <div className={`settings-item settings-button-group ${className}`}>
      <div className="settings-item-info">
        <div className="settings-label" id={groupId}>
          {label}
        </div>
        {description && (
          <p id={descId} className="settings-description">
            {description}
          </p>
        )}
      </div>
      <div
        className="settings-item-control"
        role="radiogroup"
        aria-labelledby={groupId}
        aria-describedby={description ? descId : undefined}
      >
        <div className="button-group">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={value === option.value}
              className={`button-group-option ${value === option.value ? 'button-group-option--active' : ''}`}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
            >
              {option.icon && <span className="button-group-icon">{option.icon}</span>}
              <span className="button-group-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Alias for backwards compatibility
export const SettingsSecureInput = SecureInput;
