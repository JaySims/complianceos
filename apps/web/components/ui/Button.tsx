import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;

  variant?:
    | "primary"
    | "secondary";

  onClick?: () => void;

  href?: string;

  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  href,
  className = "",
}: ButtonProps) {
  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg",

    secondary:
      "bg-white border border-slate-300 text-slate-800 hover:bg-slate-100",
  };

  const classes =
    `inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
