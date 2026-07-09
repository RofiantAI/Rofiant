export function DefaultUserAvatar({
  className = "w-11 h-11",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`${className} rounded-full shrink-0`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#CED4DA" />
      <circle cx="50" cy="45" r="15" fill="#FFFFFF" />
      <circle cx="50" cy="94" r="26" fill="#FFFFFF" />
    </svg>
  );
}
