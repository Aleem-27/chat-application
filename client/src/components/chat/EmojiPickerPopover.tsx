import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useThemeStore } from '@/store/themeStore'

interface EmojiDatum {
  native: string
}

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPickerPopover({ onSelect, onClose }: EmojiPickerPopoverProps) {
  const theme = useThemeStore((s) => s.theme)

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-20 mb-2 w-[min(350px,92vw)] overflow-hidden rounded-xl border border-line shadow-lg">
        <Picker
          data={data}
          onEmojiSelect={(emoji: EmojiDatum) => onSelect(emoji.native)}
          theme={theme}
          set="native"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={1}
        />
      </div>
    </>
  )
}