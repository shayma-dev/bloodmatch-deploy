export default function Button({ children, variant = "primary", ...props }) {
  const cls = ["btn"];
  if (variant === "ghost") cls.push("ghost");
  return <button className={cls.join(" ")} {...props}>{children}</button>;
}