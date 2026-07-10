import { useAuthStore } from '@/stores/auth.store';
import { getVerticalPack } from '@revorax/shared';

export function useVertical() {
  const { org } = useAuthStore();
  return getVerticalPack(org?.businessType);
}
