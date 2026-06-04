import { forwardRef } from "react";
import { View, Text } from "react-native";
import type { PeriodLeaderboardEntry } from "@/db/queries";
import type { Period } from "@/lib/period";
import { formatAmount } from "@/lib/currency";
import { PlayerAvatar } from "./player-avatar";
import { Logo } from "./logo";

export interface ShareCardData {
  teamName: string;
  currency: string;
  period: Period;
  leaderboard: PeriodLeaderboardEntry[];
  outstanding: number;
}

/** Fixed export width (logical points). Capture scales this up via pixelRatio. */
export const SHARE_CARD_WIDTH = 380;

// How many owing players we list before collapsing the rest into a "+N more"
// line — keeps the image a readable height even for a 30-person squad.
const MAX_ROWS = 8;

/**
 * Off-screen leaderboard card rendered for image export. The caller mounts this
 * absolutely-positioned behind the screen and captures it with captureRef. It
 * mirrors the in-app dark/amber theme so the shared image looks like the app.
 */
export const ShareCard = forwardRef<View, { data: ShareCardData }>(({ data }, ref) => {
  const { teamName, currency, period, leaderboard, outstanding } = data;

  const owing = leaderboard.filter((e) => e.remaining > 0);
  const settled = leaderboard.filter((e) => e.total > 0 && e.remaining === 0).length;
  const shown = owing.slice(0, MAX_ROWS);
  const overflow = owing.length - shown.length;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: SHARE_CARD_WIDTH }}
      className="bg-surface px-6 pt-6 pb-5"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-text-secondary text-[11px] font-semibold uppercase tracking-widest">
            {period.label}
          </Text>
          <Text className="text-text-primary text-2xl font-bold mt-1">{teamName}</Text>
        </View>
        <Logo size={36} />
      </View>

      {/* Hero */}
      <View className="mt-5 mb-4 bg-card border border-border rounded-2xl px-5 py-4">
        {owing.length === 0 ? (
          <Text className="text-success text-xl font-bold">Everyone&apos;s square 🎉</Text>
        ) : (
          <>
            <Text className="text-text-secondary text-[11px] font-semibold uppercase tracking-widest">
              Total outstanding
            </Text>
            <Text
              className="text-danger text-3xl font-extrabold mt-1"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatAmount(outstanding, currency)}
            </Text>
          </>
        )}
      </View>

      {/* Rows */}
      {shown.map((e, i) => (
        <View
          key={e.memberId}
          className="flex-row items-center py-2.5 border-b border-border"
        >
          <Text className="w-6 text-sm font-medium text-text-muted">{i + 1}</Text>
          <PlayerAvatar name={e.memberName} size={30} />
          <Text className="flex-1 text-text-primary text-base ml-3" numberOfLines={1}>
            {e.memberName}
            {e.status === "partial" ? (
              <Text className="text-text-muted text-xs"> · partial</Text>
            ) : null}
          </Text>
          <Text
            className="text-danger text-sm font-semibold"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatAmount(e.remaining, currency)}
          </Text>
        </View>
      ))}

      {overflow > 0 && (
        <Text className="text-text-muted text-xs mt-2.5">+{overflow} more still owing</Text>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-4">
        <Text className="text-text-muted text-xs">
          {settled > 0 ? `${settled} paid up ✓` : " "}
        </Text>
        <Text className="text-text-secondary text-[11px] font-semibold tracking-wide">
          Team Tally
        </Text>
      </View>
    </View>
  );
});

ShareCard.displayName = "ShareCard";
