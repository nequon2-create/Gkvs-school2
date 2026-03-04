import type { LucideIcon } from 'lucide-react';
import './QuickActionButton.css';

export interface QuickActionButtonProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    color?: 'blue' | 'emerald' | 'amber' | 'purple';
    disabled?: boolean;
}

export function QuickActionButton({
    icon: Icon,
    label,
    onClick,
    color = 'blue',
    disabled = false
}: QuickActionButtonProps) {
    return (
        <button
            className={`quick-action-btn quick-action-${color}`}
            onClick={onClick}
            disabled={disabled}
        >
            <div className="quick-action-icon">
                <Icon size={20} strokeWidth={2} />
            </div>
            <span className="quick-action-label">{label}</span>
        </button>
    );
}
