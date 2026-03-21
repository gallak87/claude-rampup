import birdUrl from '../assets/canary.png';

export function CanaryBird({ size = 80 }: { size?: number }) {
  return (
    <img
      src={birdUrl}
      width={size}
      height={size}
      alt="canary"
      style={{ flexShrink: 0 }}
    />
  );
}
