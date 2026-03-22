"use client"

interface RadarChartProps {
  data: Array<{
    category: string
    value1: number
    value2?: number
    label1: string
    label2?: string
  }>
  size?: number
}

export function RadarChart({ data, size = 400 }: RadarChartProps) {
  const center = size / 2
  const radius = size / 2 - 60
  const levels = 5

  // Calcular pontos do polígono
  const getPoint = (value: number, index: number) => {
    const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2
    const distance = (value / 5) * radius
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    }
  }

  // Calcular pontos das linhas de grade
  const getGridPoint = (level: number, index: number) => {
    const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2
    const distance = (level / levels) * radius
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    }
  }

  // Calcular pontos dos labels
  const getLabelPoint = (index: number) => {
    const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2
    const distance = radius + 30
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    }
  }

  // Criar path do polígono
  const createPath = (values: number[]) => {
    const points = values.map((value, index) => getPoint(value, index))
    return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`
  }

  const path1 = createPath(data.map((d) => d.value1))
  const path2 = data[0].value2 !== undefined ? createPath(data.map((d) => d.value2 || 0)) : null

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Linhas de grade circulares */}
        {Array.from({ length: levels }, (_, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(radius * (i + 1)) / levels}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Linhas de grade radiais */}
        {data.map((_, index) => {
          const point = getGridPoint(levels, index)
          return <line key={index} x1={center} y1={center} x2={point.x} y2={point.y} stroke="#e5e7eb" strokeWidth="1" />
        })}

        {/* Números nos níveis */}
        {Array.from({ length: levels }, (_, i) => (
          <text
            key={i}
            x={center}
            y={center - (radius * (i + 1)) / levels}
            textAnchor="middle"
            dy="-5"
            fontSize="12"
            fill="#6b7280"
          >
            {i + 1}
          </text>
        ))}

        {/* Polígono 2 (se existir) */}
        {path2 && (
          <path d={path2} fill="rgba(139, 195, 74, 0.15)" stroke="#8BC34A" strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* Polígono 1 */}
        <path d={path1} fill="rgba(45, 55, 72, 0.1)" stroke="#2D3748" strokeWidth="2" strokeLinejoin="round" />

        {/* Pontos do polígono 1 */}
        {data.map((item, index) => {
          const point = getPoint(item.value1, index)
          return (
            <circle
              key={`point1-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#2D3748"
              stroke="white"
              strokeWidth="2"
            />
          )
        })}

        {/* Pontos do polígono 2 (se existir) */}
        {path2 &&
          data.map((item, index) => {
            if (item.value2 === undefined) return null
            const point = getPoint(item.value2, index)
            return (
              <circle
                key={`point2-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#8BC34A"
                stroke="white"
                strokeWidth="2"
              />
            )
          })}

        {/* Labels das categorias */}
        {data.map((item, index) => {
          const point = getLabelPoint(index)
          return (
            <text
              key={`label-${index}`}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dy="5"
              fontSize="12"
              fontWeight="500"
              fill="#374151"
            >
              {item.category}
            </text>
          )
        })}
      </svg>

      {/* Legenda */}
      <div className="flex gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#2D3748] rounded"></div>
          <span className="text-sm font-medium">{data[0].label1}</span>
        </div>
        {data[0].label2 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#8BC34A] rounded"></div>
            <span className="text-sm font-medium">{data[0].label2}</span>
          </div>
        )}
      </div>
    </div>
  )
}
