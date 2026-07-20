import { useState, useMemo } from 'react';
import data from './data/contributors.json';
import { normalizeText } from './utils/text';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Normalize search query once when it changes
  const normalizedQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        // Reset sort on third click
        key = null;
        direction = 'asc';
      }
    }
    setSortConfig({ key, direction });
  };

  // Filter and Sort contributors
  const processedContributors = useMemo(() => {
    // 1. Filter data first
    let result = data.contributors;
    if (normalizedQuery) {
      result = data.contributors.filter((item) => {
        const nameMatch = normalizeText(item.name).includes(normalizedQuery);
        
        // Allow searching by amount (e.g. "500" to find 500.000 VND)
        const amountStr = item.amount ? String(item.amount / 1000) : '';
        const amountMatch = amountStr.includes(normalizedQuery);
        
        // Allow searching by raw note
        const noteMatch = normalizeText(item.note).includes(normalizedQuery);

        return nameMatch || amountMatch || noteMatch;
      });
    }

    // 2. Sort data second
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (sortConfig.key === 'name') {
          const valA = a.name || '';
          const valB = b.name || '';
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB, 'vi', { sensitivity: 'accent' })
            : valB.localeCompare(valA, 'vi', { sensitivity: 'accent' });
        }

        if (sortConfig.key === 'amount') {
          // Refunded entries (amount = null) are treated as -1 so they group together at the bottom when sorting asc
          const amtA = a.status === 'active' ? (a.amount || 0) : -1;
          const amtB = b.status === 'active' ? (b.amount || 0) : -1;
          return sortConfig.direction === 'asc' ? amtA - amtB : amtB - amtA;
        }

        if (sortConfig.key === 'status') {
          const statA = a.status || '';
          const statB = b.status || '';
          return sortConfig.direction === 'asc'
            ? statA.localeCompare(statB)
            : statB.localeCompare(statA);
        }

        return 0;
      });
    }

    return result;
  }, [normalizedQuery, sortConfig]);

  // Format currency helper
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  // Format update time
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Refunded contributors count
  const refundedCount = useMemo(() => {
    return data.contributors.filter(item => item.status === 'refunded').length;
  }, []);

  // Sort indicator icon builder
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <span className="sort-icon-container">↕</span>;
    }
    return (
      <span className="sort-icon-container active">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Tự động cuộn xuống danh sách khi focus vào thanh tìm kiếm
  const handleSearchFocus = () => {
    const listElement = document.querySelector('.data-display-wrapper');
    if (listElement) {
      const headerElement = document.querySelector('.header-glass');
      const headerHeight = headerElement ? headerElement.offsetHeight : 70;
      const elementPosition = listElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerHeight - 16; // chừa 16px khoảng cách
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* Background Animated Spheres */}
      <div className="bg-decorations">
        <div className="sphere sphere-1"></div>
        <div className="sphere sphere-2"></div>
        <div className="sphere sphere-3"></div>
      </div>

      {/* Header with Search */}
      <header className="header-glass">
        <div className="header-content">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setSearchQuery(''); setSortConfig({ key: null, direction: 'asc' }); }}>
            Support Kim Thi <span className="logo-heart">❤️</span>
          </a>
          
          <div className="search-box">
            <svg 
              className="search-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm tên không dấu, số tiền..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        
        {/* Hero Section */}
        <section className="hero-section glass-panel">
          <h1 className="hero-title">Support Kim Thi</h1>
          <p className="hero-desc">
            Cảm ơn cả nhà iu rất nhiều đã cùng chung tay tiếp sức cho bạn <strong style={{color: 'var(--accent-pink)'}}>Kim Thi</strong> nha! 
            Mỗi hạt cát nhỏ của mọi người là cả một bầu trời động lực giúp Thi vững bước vượt qua giai đoạn này nè. 
            Mãi iu thương và trân quý tình cảm của cả nhà mình! <span className="emoji-bounce">🙌</span> <span className="logo-heart">❤️</span>
          </p>
        </section>

        {/* Statistics Cards */}
        <section className="stats-container">
          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper primary">
              💰
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(data.totalAmount)}</span>
              <span className="stat-label">Tổng quỹ nhận được</span>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper secondary">
              🤝
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.contributors.length} người</span>
              <span className="stat-label">Tấm lòng đóng góp</span>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon-wrapper success">
              🔄
            </div>
            <div className="stat-info">
              <span className="stat-value">{refundedCount} người</span>
              <span className="stat-label">Đã chuyển trả</span>
            </div>
          </div>
        </section>

        {/* Data List Section */}
        <section className="data-display-wrapper">
          <div className="results-header">
            <div className="results-count">
              Kết quả tìm kiếm: <span>{processedContributors.length}</span> / {data.contributors.length}
            </div>
            <div className="update-badge">
              <span>🔄 Cập nhật: {formatTime(data.updatedAt)}</span>
            </div>
          </div>

          {/* Interactive Mobile Sort Toolbar */}
          <div className="mobile-sort-bar glass-panel">
            <span className="mobile-sort-label">Sắp xếp:</span>
            <div className="mobile-sort-controls">
              <button 
                className={`mobile-sort-btn ${sortConfig.key === 'name' ? 'active' : ''}`}
                onClick={() => requestSort('name')}
              >
                Tên {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </button>
              <button 
                className={`mobile-sort-btn ${sortConfig.key === 'amount' ? 'active' : ''}`}
                onClick={() => requestSort('amount')}
              >
                Số tiền {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </button>
              <button 
                className={`mobile-sort-btn ${sortConfig.key === 'status' ? 'active' : ''}`}
                onClick={() => requestSort('status')}
              >
                Trạng thái {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </button>
            </div>
          </div>

          {processedContributors.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="desktop-table-container glass-panel">
                <table className="table-responsive">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: '80px' }}>STT</th>
                      <th 
                        className="sortable-header" 
                        onClick={() => requestSort('name')}
                      >
                        Họ & Tên {getSortIndicator('name')}
                      </th>
                      <th 
                        className="sortable-header" 
                        style={{ textAlign: 'right' }}
                        onClick={() => requestSort('amount')}
                      >
                        Số tiền ủng hộ {getSortIndicator('amount')}
                      </th>
                      <th 
                        className="sortable-header" 
                        style={{ textAlign: 'center', width: '180px' }}
                        onClick={() => requestSort('status')}
                      >
                        Trạng thái {getSortIndicator('status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedContributors.map((item) => (
                      <tr key={item.stt}>
                        <td className="col-stt">{item.stt}</td>
                        <td className="col-name">{item.name}</td>
                        <td className="col-amount" style={{ textAlign: 'right' }}>
                          {item.status === 'active' ? formatCurrency(item.amount) : '—'}
                        </td>
                        <td className="col-status" style={{ textAlign: 'center' }}>
                          {item.status === 'active' ? (
                            <span className="badge badge-active">Đã nhận</span>
                          ) : (
                            <span className="badge badge-refunded" title={item.note}>
                              {item.note || 'Đã trả'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="mobile-cards-container">
                {processedContributors.map((item) => (
                  <div key={item.stt} className="mobile-card glass-panel">
                    <div className="mobile-card-header">
                      <div className="mobile-card-left">
                        <span className="mobile-card-stt">{item.stt}</span>
                        <span className="mobile-card-name">{item.name}</span>
                      </div>
                      <div className="mobile-card-amount">
                        {item.status === 'active' ? formatCurrency(item.amount) : '—'}
                      </div>
                    </div>
                    
                    <div className="mobile-card-footer">
                      <div>
                        {item.status === 'active' ? (
                          <span className="badge badge-active">Đã nhận</span>
                        ) : (
                          <span className="badge badge-refunded">Đã trả</span>
                        )}
                      </div>
                      {item.note && (
                        <div className="mobile-card-note">
                          📝 {item.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state glass-panel">
              <span className="empty-icon">🔍</span>
              <h3 className="empty-title">Không tìm thấy kết quả</h3>
              <p className="empty-desc">Thử tìm kiếm với từ khóa khác xem sao nhé!</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 Copyright by TusMePlus</p>
        </footer>
      </main>
    </>
  );
}

export default App;
