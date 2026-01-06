import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Logo } from '@repo/ui';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo width={24} height={24} className="text-foreground" />
          <span className="font-semibold ml-2">BlueprintAI</span>
        </>
      ),
    },
  };
}
