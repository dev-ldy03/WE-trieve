import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useApp } from '@/context/AppContext'
import { ITEM_KINDS } from '@/data/items'
import colors from '@/theme/colors.json'
import type { ItemKind } from '@/types'
import BottomSheet from './BottomSheet'
import Button from './Button'

/** 레퍼런스 물건 등록: 이름과 종류 */
export default function AddItemSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addItem, showToast } = useApp()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ItemKind>('wallet')

  const submit = () => {
    if (!name.trim()) return showToast('물건 이름을 입력해주세요.')
    addItem(name.trim(), kind)
    setName('')
    onClose()
    showToast('새 물건을 등록했어요. (시연)')
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="물건 등록">
      <Text className="mb-2 mt-2 font-semibold text-ink" style={{ fontSize: 12 }}>
        물건 이름
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="예: 매일 쓰는 헤드폰"
        placeholderTextColor={colors.faint}
        maxLength={20}
        accessibilityLabel="물건 이름"
        onSubmitEditing={submit}
        className="rounded-[12px] border border-[#dce3d8] bg-paper p-3 text-ink"
      />
      <Text className="mb-2 mt-4 font-semibold text-ink" style={{ fontSize: 12 }}>
        물건 종류
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {ITEM_KINDS.map((k) => (
          <Pressable
            key={k.kind}
            onPress={() => setKind(k.kind)}
            accessibilityState={{ selected: kind === k.kind }}
            className={`rounded-[8px] border px-3.5 py-[7px] ${kind === k.kind ? 'border-accent-soft bg-accent-soft' : 'border-line bg-paper'}`}
          >
            <Text className={kind === k.kind ? 'text-accent' : 'text-ink'} style={{ fontSize: 12 }}>
              {k.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="mt-4 text-muted" style={{ fontSize: 11, lineHeight: 18 }}>
        기기 연결 없이 물건 등록 화면을 체험해요.
      </Text>
      <Button label="물건 등록하기" onPress={submit} full />
    </BottomSheet>
  )
}
