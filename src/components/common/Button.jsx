/**
 * Centralized Art Deco button component for the entire app.
 * All buttons should use this component for consistent styling.
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' (default: 'secondary')
 * @param {string} size - 'icon' | 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} title - Button text (required for non-icon buttons)
 * @param {ReactNode} children - Only used for icon buttons (size="icon")
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {boolean} active - Whether button is in active state (for tabs)
 * @param {string} className - Additional CSS classes (avoid using for styling - use props)
 * 
 * Size Guide:
 *   - 'icon': 24x24 square for icon buttons (+, ×, ★) - uses children
 *   - 'sm': Small inline actions (Reset, Save, Load) - uses title
 *   - 'md': Standard buttons, tabs - uses title
 *   - 'lg': Primary CTAs (Generate Scripts, Analyze) - uses title
 * 
 * Usage:
 *   <Button title="Reset" />
 *   <Button variant="primary" size="lg" fullWidth title="Generate Scripts" />
 *   <Button size="sm" title="Save" />
 *   <Button size="icon">+</Button>
 *   <Button size="icon" variant="primary">★</Button>
 *   <Button active title="Active Tab" />
 */
export default function Button({ 
    title,
    children, 
    variant = 'secondary', 
    size = 'md', 
    fullWidth = false,
    active = false,
    className = '',
    ...props 
}) {
    const isIcon = size === 'icon';
    
    const classes = [
        'btn',
        `btn-${size}`,
        variant !== 'secondary' && `btn-${variant}`,
        fullWidth && 'btn-full',
        active && 'btn-active',
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props}>
            {isIcon ? children : title}
        </button>
    );
}
