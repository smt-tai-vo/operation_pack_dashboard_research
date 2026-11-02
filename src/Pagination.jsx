import { ChevronLeft, ChevronRight } from 'lucide-react'
import './pagination.css'

export default function Pagination({ total, page, size, onPageChange, onSizeChange, label }) {
  const pages = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(1, page), pages)
  const start = Math.max(1, Math.min(current - 2, pages - 4))
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i)
  return <nav className="dashboard-pagination" aria-label={`Phân trang ${label}`}>
    <span><b>{total}</b> kết quả <span className="pagination-range">· {total ? (current - 1) * size + 1 : 0}–{Math.min(current * size, total)} / {total}</span></span>
    <div>
      <button type="button" aria-label="Trang trước" disabled={current === 1} onClick={() => onPageChange(current - 1)}><ChevronLeft size={16}/></button>
      {numbers.map(n => <button type="button" key={n} aria-label={`Trang ${n}`} aria-current={current === n ? 'page' : undefined} onClick={() => onPageChange(n)}>{n}</button>)}
      <button type="button" aria-label="Trang sau" disabled={current === pages} onClick={() => onPageChange(current + 1)}><ChevronRight size={16}/></button>
      <select aria-label="Số dòng mỗi trang" value={size} onChange={e => onSizeChange(Number(e.target.value))}>{[5,10,20,50].map(n => <option key={n} value={n}>{n} / trang</option>)}</select>
    </div>
  </nav>
}
