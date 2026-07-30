export function OnlineDot({ online }: { online: boolean }) {
  if (!online) return null
  return <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-panel bg-signal" />
}