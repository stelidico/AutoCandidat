export default function Logo({ size = 32, showText = true, textColor = '#1e293b' }) {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.svg" width={size} height={size} alt="Autocandidat logo" style={{ objectFit: 'contain' }} />
      {showText && (
        <span className="font-bold text-base leading-none" style={{ color: textColor }}>
          Autocandidat
        </span>
      )}
    </div>
  );
}
