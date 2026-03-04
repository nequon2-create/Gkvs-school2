import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

interface BackButtonProps {
    label?: string;
    to?: string | number;
    className?: string;
}

export function BackButton({ label = 'Back', to = -1, className = '' }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (typeof to === 'number') {
            navigate(to as number);
        } else {
            navigate(to as string);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`back-button ${className}`}
            aria-label="Go back"
        >
            <ArrowLeft size={20} />
            <span>{label}</span>
        </button>
    );
}
