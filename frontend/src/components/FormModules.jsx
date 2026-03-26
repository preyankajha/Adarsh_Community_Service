
import React, { useState } from 'react';

export const EnhancedListManager = ({ items = [], onAdd, onRemove, placeholder, label, options = [], language = 'en' }) => {
    const [input, setInput] = useState('');
    const [apiSuggestions, setApiSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = (val) => {
        const valueToAdd = val || input.trim();
        if (valueToAdd && !items.includes(valueToAdd)) {
            onAdd(valueToAdd);
            setInput('');
            setApiSuggestions([]);
        }
    };

    const fetchSuggestions = async (q) => {
        if (q.length < 2) return setApiSuggestions([]);
        try {
            setIsLoading(true);
            const res = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`);
            const data = await res.json();
            if (Array.isArray(data) && data[1]) {
                setApiSuggestions(data[1].map(s => ({ value: s, [language]: s })));
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        fetchSuggestions(val);
    };

    return (
        <div className="input-group" style={{ width: '100%' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginBottom: '8px', display: 'block' }}>{label}</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        className="form-input"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                        style={{ width: '100%', paddingRight: '40px' }}
                    />
                    {input.trim() && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 100,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            marginTop: '4px'
                        }}>
                            {/* Local Options first */}
                            {options.filter(o => o[language].toLowerCase().includes(input.toLowerCase())).map(opt => (
                                <div
                                    key={opt.value}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                    onMouseDown={() => handleAdd(opt[language])}
                                    onMouseEnter={e => e.target.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.target.style.background = 'white'}
                                >
                                    {opt[language]}
                                </div>
                            ))}
                            {/* API Suggestions as backup or more options */}
                            {apiSuggestions.filter(s => !options.some(o => o[language] === s[language])).map((opt, idx) => (
                                <div
                                    key={'api-'+idx}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}
                                    onMouseDown={() => handleAdd(opt[language])}
                                    onMouseEnter={e => e.target.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.target.style.background = 'white'}
                                >
                                     ✨ {opt[language]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => handleAdd()}
                    style={{
                        padding: '0 16px',
                        background: '#D87C1D',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '1.2rem'
                    }}
                >
                    +
                </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: '#fff7ed',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1.5px solid #ffedd5',
                            color: '#9a3412',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(216, 124, 29, 0.05)'
                        }}
                    >
                        {item}
                        <span
                            onClick={() => onRemove(item)}
                            style={{ cursor: 'pointer', fontWeight: 900, color: '#f97316', fontSize: '1.1rem' }}
                        >
                            ×
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const EducationHistoryManager = ({ history = [], onChange, t, language = 'en' }) => {
    const [suggestions, setSuggestions] = useState({});
    const [activeRow, setActiveRow] = useState(null);

    const defaultLevels = [
        { en: '10th / Secondary', hi: '10वीं / माध्यमिक' },
        { en: '12th / Sr. Secondary', hi: '12वीं / उच्च माध्यमिक' },
        { en: 'Graduation', hi: 'स्नातक' },
        { en: 'Post Graduation', hi: 'स्नातकोत्तर' },
        { en: 'Professional Course (CA/CS/MBBS/etc.)', hi: 'प्रोफेशनल कोर्स (CA/CS/MBBS आदि)' },
        { en: 'PhD / Other', hi: 'पीएचडी / अन्य' }
    ];

    const COMMON_BOARDS = [
        { en: 'CBSE', hi: 'CBSE' },
        { en: 'ICSE / ISC', hi: 'ICSE / ISC' },
        { en: 'NIOS', hi: 'NIOS' },
        { en: 'BSEB (Bihar)', hi: 'BSEB (बिहार)' },
        { en: 'RBSE (Rajasthan)', hi: 'RBSE (राजस्थान)' },
        { en: 'UPMSP (Uttar Pradesh)', hi: 'UPMSP (उत्तर प्रदेश)' },
        { en: 'Other State Board', hi: 'अन्य राज्य बोर्ड' }
    ];

    const fetchUniversities = async (idx, q) => {
        if (!q || q.length < 3) return;
        try {
            const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(q)}&country=india`);
            const data = await res.json();
            setSuggestions(prev => ({ ...prev, [idx]: data.map(u => u.name) }));
        } catch (err) {
            console.error(err);
        }
    };

    const addRow = () => {
        onChange([...history, { level: '', board: '', year: '', result: '' }]);
    };

    const removeRow = (idx) => {
        onChange(history.filter((_, i) => i !== idx));
    };

    const updateRow = (idx, field, val) => {
        const newHistory = [...history];
        newHistory[idx][field] = val;
        onChange(newHistory);
    };

    return (
        <div className="education-manager" style={{ width: '100%', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>{language === 'hi' ? 'परीक्षा / स्तर' : 'Exam / Level'}</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>{language === 'hi' ? 'बोर्ड / विश्वविद्यालय' : 'Board / University'}</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>{language === 'hi' ? 'वर्ष' : 'Year'}</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>{language === 'hi' ? 'परिणाम (%)' : 'Result (%)'}</th>
                            <th style={{ padding: '12px', width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px' }}>
                                    <select
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        value={row.level}
                                        onChange={e => updateRow(idx, 'level', e.target.value)}
                                    >
                                        <option value="">-- {language === 'hi' ? 'चुनें' : 'Select'} --</option>
                                        {defaultLevels.map(lvl => <option key={lvl.en} value={lvl.en}>{lvl[language]}</option>)}
                                    </select>
                                </td>
                                <td style={{ padding: '8px', position: 'relative' }}>
                                    <input
                                        placeholder="e.g. CBSE / Delhi University"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        value={row.board}
                                        onChange={e => {
                                            updateRow(idx, 'board', e.target.value);
                                            if (['Graduation', 'Post Graduation', 'PhD / Other'].includes(row.level)) {
                                                fetchUniversities(idx, e.target.value);
                                            }
                                        }}
                                        onFocus={() => setActiveRow(idx)}
                                        onBlur={() => setTimeout(() => setActiveRow(null), 200)}
                                    />
                                    {activeRow === idx && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 8,
                                            right: 8,
                                            zIndex: 50,
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            {/* School Boards for 10th/12th */}
                                            {['10th / Secondary', '12th / Sr. Secondary'].includes(row.level) && COMMON_BOARDS.map((b, i) => (
                                                <div key={i} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onMouseDown={() => updateRow(idx, 'board', b[language])}>
                                                    🏫 {b[language]}
                                                </div>
                                            ))}
                                            {/* University Suggestions from API */}
                                            {['Graduation', 'Post Graduation', 'PhD / Other'].includes(row.level) && suggestions[idx]?.map((u, i) => (
                                                <div key={i} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onMouseDown={() => updateRow(idx, 'board', u)}>
                                                    🎓 {u}
                                                </div>
                                            ))}
                                            {/* Fallback school boards for other levels too if needed */}
                                            {!['10th / Secondary', '12th / Sr. Secondary'].includes(row.level) && !suggestions[idx] && COMMON_BOARDS.slice(0, 3).map((b, i) => (
                                                <div key={'f'+i} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onMouseDown={() => updateRow(idx, 'board', b[language])}>
                                                    🏫 {b[language]}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <input
                                        type="number"
                                        placeholder="YYYY"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        value={row.year}
                                        onChange={e => updateRow(idx, 'year', e.target.value)}
                                    />
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <input
                                        placeholder="%"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        value={row.result}
                                        onChange={e => updateRow(idx, 'result', e.target.value)}
                                    />
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(idx)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900 }}
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button
                type="button"
                onClick={addRow}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f8fafc',
                    border: 'none',
                    borderTop: '1px solid #e2e8f0',
                    color: '#D87C1D',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                + {language === 'hi' ? 'नया शैक्षणिक रिकॉर्ड जोड़ें' : 'Add Academic Record'}
            </button>
        </div>
    );
};
