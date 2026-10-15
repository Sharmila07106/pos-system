import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Palette,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Layout,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PRESETS = [
  { name: 'StoreFlow Teal (Default)', color: '#0FA38F' },
  { name: 'Emerald Grove', color: '#059669' },
  { name: 'Royal Indigo', color: '#6366F1' },
  { name: 'Ocean Azure', color: '#0284C7' },
  { name: 'Sunset Crimson', color: '#E11D48' },
  { name: 'Midnight Violet', color: '#7C3AED' },
  { name: 'Golden Amber', color: '#D97706' },
  { name: 'Slate Graphite', color: '#475569' },
];

export default function Appearance() {
  const { accentColor: globalAccent, onAccentColorChange } = useOutletContext() || {};
  const [selectedColor, setSelectedColor] = useState(globalAccent || '#0FA38F');
  const [selectedPresetName, setSelectedPresetName] = useState('StoreFlow Teal (Default)');
  const [saving, setSaving] = useState(false);
  const [savedSettings, setSavedSettings] = useState(null);

  // Load current appearance from MongoDB
  const fetchAppearance = async () => {
    try {
      const res = await api.get('/platform/appearance');
      if (res.data?.success && res.data.data?.accentColor) {
        setSelectedColor(res.data.data.accentColor);
        setSelectedPresetName(res.data.data.presetName || 'Custom');
        setSavedSettings(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load appearance settings from backend:', err);
    }
  };

  useEffect(() => {
    fetchAppearance();
  }, []);

  const handleSelectPreset = (preset) => {
    setSelectedColor(preset.color);
    setSelectedPresetName(preset.name);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    const match = PRESETS.find((p) => p.color.toLowerCase() === color.toLowerCase());
    setSelectedPresetName(match ? match.name : 'Custom Hex');
  };

  const handleSaveAppearance = async () => {
    if (!selectedColor || !/^#[0-9A-Fa-f]{6}$/.test(selectedColor)) {
      toast.error('Please choose a valid 6-character hex color');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/platform/appearance', {
        accentColor: selectedColor,
        presetName: selectedPresetName,
      });

      if (res.data?.success) {
        toast.success('Accent appearance saved to database!');
        if (onAccentColorChange) {
          onAccentColorChange(selectedColor);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save appearance settings.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    setSelectedColor('#0FA38F');
    setSelectedPresetName('StoreFlow Teal (Default)');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
            Platform Appearance & Branding
          </h2>
          <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
            Customize the accent color across all Platform Admin navigation elements, buttons, and status indicators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefault}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#53607A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset to Teal</span>
          </button>

          <button
            onClick={handleSaveAppearance}
            disabled={saving}
            style={{ backgroundColor: selectedColor }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Accent Color'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Color Palette & Pickers (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Palettes */}
          <div className="bg-white rounded-2xl p-6 border border-[#E3E8F0] shadow-sm">
            <h3 className="font-extrabold text-sm sm:text-base text-[#0B1B3A] flex items-center gap-2 mb-4">
              <Sparkles size={18} style={{ color: selectedColor }} />
              Preset Color Palettes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((preset) => {
                const isSelected =
                  selectedColor.toLowerCase() === preset.color.toLowerCase();
                return (
                  <button
                    key={preset.color}
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0B1B3A] bg-[#F8FAFC] ring-2 ring-[#0B1B3A]/10 shadow-xs'
                        : 'border-[#E3E8F0] hover:border-[#CBD5E1] bg-white'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: preset.color }}
                      className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white shadow-2xs"
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0B1B3A] truncate">{preset.name}</div>
                      <div className="text-[11px] font-mono text-[#8B96AB]">{preset.color}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Picker */}
          <div className="bg-white rounded-2xl p-6 border border-[#E3E8F0] shadow-sm">
            <h3 className="font-extrabold text-sm sm:text-base text-[#0B1B3A] flex items-center gap-2 mb-4">
              <Palette size={18} style={{ color: selectedColor }} />
              Custom Color Picker
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={handleCustomColorChange}
                  className="w-14 h-14 rounded-xl cursor-pointer border border-[#CBD5E1] p-1 bg-white"
                />
                <div>
                  <span className="text-xs font-bold text-[#53607A] uppercase">Selected Hex</span>
                  <input
                    type="text"
                    value={selectedColor.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedColor(val);
                      setSelectedPresetName('Custom Hex');
                    }}
                    maxLength={7}
                    className="block mt-1 px-3 py-1.5 font-mono text-sm font-bold text-[#0B1B3A] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl w-32 focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>
              </div>

              <div className="text-xs text-[#53607A] leading-relaxed border-l sm:border-l sm:pl-4 border-[#E3E8F0]">
                Choose any brand hex color. This updates the sidebar active indicator, POS Dashboard link, primary buttons, and metric accent highlights.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live UI Preview */}
        <div className="bg-white rounded-2xl p-6 border border-[#E3E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
              <Eye size={18} className="text-[#8B96AB]" />
              <h3 className="font-extrabold text-sm text-[#0B1B3A]">Live UI Preview</h3>
            </div>

            {/* Mock Sidebar Item */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-2">
                  Active Sidebar Item
                </span>
                <div className="bg-[#0B1B3A] p-2.5 rounded-xl text-white relative flex items-center gap-3">
                  <span
                    style={{ backgroundColor: selectedColor }}
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                  />
                  <Layout size={16} style={{ color: selectedColor }} />
                  <span className="text-xs font-bold">Supermarket Applications</span>
                  <span
                    style={{ backgroundColor: selectedColor }}
                    className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                  >
                    3
                  </span>
                </div>
              </div>

              {/* Mock Primary Button */}
              <div>
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-2">
                  Primary Action Button
                </span>
                <button
                  style={{ backgroundColor: selectedColor }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white shadow-xs cursor-default flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  <span>Approve & Activate Store</span>
                </button>
              </div>

              {/* Mock Status Pill */}
              <div>
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-2">
                  Accent Pill & Indicator
                </span>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      backgroundColor: `${selectedColor}15`,
                      color: selectedColor,
                      borderColor: `${selectedColor}40`,
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-bold border"
                  >
                    Verified Tenant
                  </span>
                  <span
                    style={{
                      backgroundColor: `${selectedColor}15`,
                      color: selectedColor,
                      borderColor: `${selectedColor}40`,
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-bold border"
                  >
                    Multi-Tenant v2.0
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#F1F5F9] text-center">
            <span className="text-xs font-semibold text-[#8B96AB]">
              Active preset: <span className="text-[#0B1B3A] font-bold">{selectedPresetName}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
