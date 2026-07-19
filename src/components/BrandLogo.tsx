export default function BrandLogo({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="دار الأساس"
      width={size}
      height={size}
      className={`block shrink-0 object-cover ${className}`}
    />
  );
}
