export function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5">
      {/* <div className="size-8 rounded-xl bg-gradient-to-br from-berry to-tint grid place-items-center text-white font-display font-bold text-sm">
        S
      </div> */}
      <img
        src='src/utils/assets/banner.png'
        alt="Sistine Logo"
        className="size-20 rounded-[1.5rem] object-contain"
      />

      {/* <span className="font-display font-bold text-lg tracking-tight text-ink">Sistine</span> */}
    </a>
  );
}