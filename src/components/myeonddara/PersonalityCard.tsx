// ====================================================
// 타고난 기질 카드
// - 기질 태그 (레드오렌지 배경)
// - 기질 설명 텍스트
// ====================================================

interface PersonalityCardProps {
  tags: string[];
  description: string;
}

export default function PersonalityCard({ tags, description }: PersonalityCardProps) {
  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">
      <h2 className="text-sm font-bold text-base-text mb-4">타고난 기질</h2>

      {/* 기질 태그 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 기질 설명 */}
      <p className="text-sm text-base-muted leading-relaxed">{description}</p>
    </div>
  );
}
