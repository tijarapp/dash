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
      src="/app_icon_master_1024.png"
      alt="دار الأساس"
      width={size}
      height={size}
      className={`block shrink-0 object-cover ${className}`}
    />
  );
}
