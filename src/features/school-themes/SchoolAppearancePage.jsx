import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Moon,
  Type,
} from "lucide-react";
import { fetchSchoolTheme, saveSchoolTheme } from "./schoolThemeApi.js";
import "./school-themes.css";
import { applySchoolTheme } from "./schoolThemeRuntime.js";
import ConfirmActionModal from "../../components/ConfirmActionModal.jsx";

const DEFAULT_THEME = {
  primaryColor: "#216b49",
  secondaryColor: "#287b59",
  accentColor: "#eaf3ec",
  pageBackground: "#f4f6f5",
  surfaceColor: "#ffffff",
  textColor: "#1c2821",
  mutedTextColor: "#59665e",
  borderColor: "#dfe5e0",
  mode: "LIGHT",
  fontFamily: "Inter",
};

const COLOR_FIELDS = [
  {
    key: "primaryColor",
    label: "Brand colour",
    hint: "Buttons and main highlights",
  },
  {
    key: "secondaryColor",
    label: "Secondary colour",
    hint: "Navigation and supporting accents",
  },
  {
    key: "accentColor",
    label: "Soft highlight",
    hint: "Selected items and subtle highlights",
  },
  {
    key: "pageBackground",
    label: "Page background",
    hint: "The space behind your content",
  },
  {
    key: "surfaceColor",
    label: "Card background",
    hint: "Cards, panels and menus",
  },
  {
    key: "textColor",
    label: "Main text",
    hint: "Headings and important information",
  },
  {
    key: "mutedTextColor",
    label: "Secondary text",
    hint: "Descriptions and supporting text",
  },
  { key: "borderColor", label: "Borders", hint: "Dividers and outlines" },
];

const THEMES = [
  {
    id: "forest",
    name: "Forest",
    description: "Natural and confident",
    colors: ["#216b49", "#287b59", "#eaf3ec", "#f4f6f5"],
    values: { ...DEFAULT_THEME },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm and professional",
    colors: ["#1769aa", "#2587bd", "#e7f3fc", "#f3f7fb"],
    values: {
      ...DEFAULT_THEME,
      primaryColor: "#1769aa",
      secondaryColor: "#2587bd",
      accentColor: "#e7f3fc",
      pageBackground: "#f3f7fb",
      borderColor: "#dce7f0",
    },
  },
  {
    id: "royal",
    name: "Royal",
    description: "Bold and distinguished",
    colors: ["#59359b", "#7952b3", "#f0eafd", "#f7f5fb"],
    values: {
      ...DEFAULT_THEME,
      primaryColor: "#59359b",
      secondaryColor: "#7952b3",
      accentColor: "#f0eafd",
      pageBackground: "#f7f5fb",
      borderColor: "#e5dff0",
    },
  },
  {
    id: "warm",
    name: "Warm",
    description: "Welcoming and vibrant",
    colors: ["#a64b24", "#cc703f", "#fff0e5", "#fbf6f2"],
    values: {
      ...DEFAULT_THEME,
      primaryColor: "#a64b24",
      secondaryColor: "#cc703f",
      accentColor: "#fff0e5",
      pageBackground: "#fbf6f2",
      borderColor: "#eee1d7",
    },
  },
  {
    id: "classic",
    name: "Classic",
    description: "Clean and understated",
    colors: ["#344256", "#52657d", "#eaf0f6", "#f4f6f8"],
    values: {
      ...DEFAULT_THEME,
      primaryColor: "#344256",
      secondaryColor: "#52657d",
      accentColor: "#eaf0f6",
      pageBackground: "#f4f6f8",
      borderColor: "#dce2e9",
    },
  },
];

const NAMED_SWATCHES = [
  { name: "Forest green", color: "#216b49" },
  { name: "Emerald", color: "#16805d" },
  { name: "Teal", color: "#087e8b" },
  { name: "Ocean blue", color: "#1769aa" },
  { name: "Sky blue", color: "#2998d8" },
  { name: "Royal purple", color: "#7041a6" },
  { name: "Berry", color: "#a43d68" },
  { name: "Red", color: "#c33d3d" },
  { name: "Orange", color: "#cc703f" },
  { name: "Gold", color: "#c28a18" },
  { name: "Charcoal", color: "#344256" },
  { name: "Slate", color: "#64748b" },
];

const DARK_COLORS = {
  pageBackground: "#151d19",
  surfaceColor: "#202b24",
  textColor: "#edf4ef",
  mutedTextColor: "#b0beb4",
  borderColor: "#38483d",
};

function sameTheme(a, b) {
  return Object.keys(DEFAULT_THEME).every((key) => a[key] === b[key]);
}

function applyMode(theme) {
  return theme.mode === "DARK" ? { ...theme, ...DARK_COLORS } : theme;
}

function applyPreviewTheme(theme) {
  const effective = applyMode(theme);
  return {
    "--preview-primary": effective.primaryColor,
    "--preview-secondary": effective.secondaryColor,
    "--preview-accent": effective.accentColor,
    "--preview-background": effective.pageBackground,
    "--preview-surface": effective.surfaceColor,
    "--preview-text": effective.textColor,
    "--preview-muted": effective.mutedTextColor,
    "--preview-border": effective.borderColor,
    "--preview-font": theme.fontFamily,
  };
}

const THEME_SETTING_KEYS = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "pageBackground",
  "surfaceColor",
  "textColor",
  "mutedTextColor",
  "borderColor",
  "mode",
  "fontFamily",
];

function getThemeSettings(theme) {
  return Object.fromEntries(
    THEME_SETTING_KEYS.filter((key) => theme[key] !== undefined).map((key) => [
      key,
      theme[key],
    ]),
  );
}

export default function SchoolAppearancePage({ signOut, user }) {
  const [saved, setSaved] = useState(DEFAULT_THEME);
  const [draft, setDraft] = useState(DEFAULT_THEME);
  const [activeColor, setActiveColor] = useState("primaryColor");
  const [activeTab, setActiveTab] = useState("themes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState("");
  const canEdit = ["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(user?.role);
  const dirty = useMemo(() => !sameTheme(saved, draft), [saved, draft]);
  const selectedTheme = THEMES.find((theme) =>
    ["primaryColor", "secondaryColor", "accentColor", "pageBackground"].every(
      (key) => theme.values[key].toLowerCase() === draft[key]?.toLowerCase(),
    ),
  );

  useEffect(() => {
    let cancelled = false;

    fetchSchoolTheme()
      .then((theme) => {
        if (cancelled) return;
        const normalized = { ...DEFAULT_THEME, ...theme };
        setSaved(normalized);
        setDraft(normalized);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(cause.message);
        if (cause.status === 401) signOut();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  function updateColor(key, color) {
    setDraft((current) => ({ ...current, [key]: color }));
    setNotice("");
  }

  function chooseTheme(theme) {
    setDraft((current) => ({
      ...current,
      ...theme.values,
      mode: current.mode,
      fontFamily: current.fontFamily,
    }));
    setNotice("");
  }

  function changeMode(mode) {
    setDraft((current) => ({ ...current, mode }));
    setNotice("");
  }

  function resetChanges() {
    setDraft(saved);
    setError("");
    setNotice("");
  }

  async function handleResetDefault() {
    if (!canEdit || saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const defaults = getThemeSettings(DEFAULT_THEME);
      const updated = await saveSchoolTheme(defaults);
      const normalized = { ...DEFAULT_THEME, ...updated };

      setSaved(normalized);
      setDraft(normalized);

      applySchoolTheme(normalized);

      window.dispatchEvent(
        new CustomEvent("school-theme-updated", {
          detail: normalized,
        }),
      );

      setNotice("School appearance has been reset to the default theme.");
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!canEdit || !dirty || saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const updated = await saveSchoolTheme(getThemeSettings(draft));
      const normalized = { ...DEFAULT_THEME, ...updated };
      setSaved(normalized);
      setDraft(normalized);

      window.dispatchEvent(
        new CustomEvent("school-theme-updated", {
          detail: normalized,
        }),
      );

      setNotice("Your school appearance has been saved.");
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  async function confirmAppearanceAction() {
    const action = pendingConfirmation;
    setPendingConfirmation("");
    if (action === "save") await handleSave();
    if (action === "default") await handleResetDefault();
    if (action === "discard") resetChanges();
  }

  const confirmationCopy = {
    save: {
      title: "Save appearance changes?",
      message: "Your new theme will be saved and applied across the school portal.",
      confirmLabel: "Save changes",
      tone: "primary",
    },
    default: {
      title: "Reset to default theme?",
      message: "This will replace the currently saved school appearance with the default theme.",
      confirmLabel: "Reset to default",
      tone: "danger",
    },
    discard: {
      title: "Discard unsaved changes?",
      message: "Your current preview changes will be discarded and the saved appearance will be restored.",
      confirmLabel: "Discard changes",
      tone: "danger",
    },
  }[pendingConfirmation];

  if (loading) {
    return (
      <div className="panel">
        <div className="table-message">
          <LoaderCircle size={20} className="animate-spin" />
          Loading your school appearance…
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="appearance-page">
      <div className="appearance-heading">
        <div>
          <p className="eyebrow">PERSONALISE YOUR WORKSPACE</p>
          <h1 className="page-title">
            School appearance<span className="title-dot">.</span>
          </h1>
          <p className="appearance-subtitle">
            Give your school portal its own look. Choose colours, preview your
            changes, and save when you are happy.
          </p>
        </div>

        <div className="appearance-actions">
          {dirty && <span className="appearance-unsaved">Unsaved changes</span>}
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPendingConfirmation("discard")}
            disabled={!dirty || saving}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setPendingConfirmation("default")}
            disabled={!canEdit || saving}
          >
            Reset to Default
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => setPendingConfirmation("save")}
            disabled={!canEdit || !dirty || saving}
          >
            {saving ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {!canEdit && (
        <div className="appearance-info" role="status">
          You can preview the school's appearance, but only school
          administrators can save changes.
        </div>
      )}
      {error && (
        <div className="notice-error mb-4" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="teaching-assignment-notice mb-4" role="status">
          {notice}
        </div>
      )}

      <div
        className="appearance-tabs"
        role="tablist"
        aria-label="Appearance settings"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "themes"}
          className={activeTab === "themes" ? "active" : ""}
          onClick={() => setActiveTab("themes")}
        >
          <Sparkles size={16} /> Themes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "colours"}
          className={activeTab === "colours" ? "active" : ""}
          onClick={() => setActiveTab("colours")}
        >
          <Palette size={16} /> Colours
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "typography"}
          className={activeTab === "typography" ? "active" : ""}
          onClick={() => setActiveTab("typography")}
        >
          <Type size={16} /> Typography
        </button>
      </div>

      <div className="appearance-layout">
        <section className="appearance-editor">
          {activeTab === "themes" && (
            <div className="appearance-card">
              <div className="appearance-card-heading">
                <div>
                  <h2>Choose your style</h2>
                  <p>
                    Start with a coordinated palette. You can customise it
                    afterwards.
                  </p>
                </div>
                <Sparkles size={20} />
              </div>

              <div className="theme-gallery">
                {THEMES.map((theme) => {
                  const selected = selectedTheme?.id === theme.id;
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      className={`theme-option ${selected ? "selected" : ""}`}
                      onClick={() => chooseTheme(theme)}
                      aria-pressed={selected}
                    >
                      <div className="theme-swatch-strip">
                        {theme.colors.map((color) => (
                          <span
                            key={color}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        {selected && (
                          <span className="theme-selected-mark">
                            <Check size={13} />
                          </span>
                        )}
                      </div>
                      <span className="theme-option-name">{theme.name}</span>
                      <span className="theme-option-description">
                        {theme.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="appearance-tip">
                <Sparkles size={17} />
                <p>
                  <strong>Tip:</strong> Pick a palette that matches your school
                  badge or uniform.
                </p>
              </div>
            </div>
          )}

          {activeTab === "colours" && (
            <div className="appearance-card">
              <div className="appearance-card-heading">
                <div>
                  <h2>Customise your colours</h2>
                  <p>
                    Select a colour just like you would in a document editor.
                  </p>
                </div>
                <Palette size={20} />
              </div>

              <div className="color-field-list">
                {COLOR_FIELDS.map((field) => (
                  <button
                    type="button"
                    key={field.key}
                    className={`color-field-row ${activeColor === field.key ? "active" : ""}`}
                    onClick={() => setActiveColor(field.key)}
                    aria-pressed={activeColor === field.key}
                  >
                    <span
                      className="color-field-swatch"
                      style={{ backgroundColor: draft[field.key] }}
                    />
                    <span className="color-field-copy">
                      <strong>{field.label}</strong>
                      <small>{field.hint}</small>
                    </span>
                    <span className="color-field-value">
                      {draft[field.key].toUpperCase()}
                    </span>
                    <ChevronDown size={16} className="color-field-chevron" />
                  </button>
                ))}
              </div>

              <div className="color-picker-panel">
                <div className="color-picker-title">
                  <div>
                    <h3>
                      {
                        COLOR_FIELDS.find((field) => field.key === activeColor)
                          ?.label
                      }
                    </h3>
                    <p>Choose a colour you like</p>
                  </div>
                  <label
                    className="native-color-picker"
                    style={{ backgroundColor: draft[activeColor] }}
                    title="Open colour picker"
                  >
                    <input
                      aria-label={`Choose ${activeColor}`}
                      type="color"
                      value={draft[activeColor]}
                      disabled={!canEdit}
                      onChange={(event) =>
                        updateColor(activeColor, event.target.value)
                      }
                    />
                    <Palette size={17} />
                  </label>
                </div>

                <div className="color-picker-instructions">
                  Select any colour from the colour spectrum, or choose one of
                  the ready-made colours below.
                </div>

                <div className="named-swatches">
                  {NAMED_SWATCHES.map((swatch) => (
                    <button
                      type="button"
                      key={swatch.color}
                      className="named-swatch"
                      title={swatch.name}
                      aria-label={swatch.name}
                      onClick={() => updateColor(activeColor, swatch.color)}
                      disabled={!canEdit}
                    >
                      <span style={{ backgroundColor: swatch.color }} />
                      {draft[activeColor].toLowerCase() ===
                        swatch.color.toLowerCase() && (
                        <CheckCircle2 size={15} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="color-picker-footer">
                  <span>Selected colour</span>
                  <span className="selected-color-label">
                    <span style={{ backgroundColor: draft[activeColor] }} />
                    {NAMED_SWATCHES.find(
                      (item) =>
                        item.color.toLowerCase() ===
                        draft[activeColor].toLowerCase(),
                    )?.name || "Custom colour"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "typography" && (
            <div className="appearance-card">
              <div className="appearance-card-heading">
                <div>
                  <h2>Typography</h2>
                  <p>
                    Choose a font that makes the school portal easy to read.
                  </p>
                </div>
                <Type size={20} />
              </div>

              <div className="font-choice-list">
                {[
                  { name: "Inter", description: "Modern and balanced" },
                  { name: "Roboto", description: "Clean and familiar" },
                  { name: "Open Sans", description: "Friendly and readable" },
                  { name: "Lato", description: "Warm and professional" },
                  { name: "Poppins", description: "Geometric and modern" },
                  { name: "Arial", description: "Simple and widely available" },
                  { name: "system-ui", description: "Use your device default" },
                ].map((font) => (
                  <button
                    type="button"
                    key={font.name}
                    className={`font-choice ${draft.fontFamily === font.name ? "selected" : ""}`}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        fontFamily: font.name,
                      }))
                    }
                    disabled={!canEdit}
                  >
                    <span>
                      <strong style={{ fontFamily: font.name }}>
                        {font.name}
                      </strong>
                      <small>{font.description}</small>
                    </span>
                    <span
                      className="font-sample"
                      style={{ fontFamily: font.name }}
                    >
                      Aa Bb 123
                    </span>
                    {draft.fontFamily === font.name && <Check size={17} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="appearance-mode-card">
            <div className="appearance-mode-copy">
              <div className="appearance-mode-icon">
                {draft.mode === "LIGHT" ? (
                  <Sun size={19} />
                ) : (
                  <Moon size={19} />
                )}
              </div>
              <div>
                <h3>School default mode</h3>
                <p>Choose the workspace default. Each person can switch modes from the top bar.</p>
              </div>
            </div>
            <div className="appearance-mode-toggle">
              <button
                type="button"
                className={draft.mode === "LIGHT" ? "selected" : ""}
                onClick={() => changeMode("LIGHT")}
                aria-pressed={draft.mode === "LIGHT"}
              >
                <Sun size={15} /> Light
              </button>
              <button
                type="button"
                className={draft.mode === "DARK" ? "selected" : ""}
                onClick={() => changeMode("DARK")}
                aria-pressed={draft.mode === "DARK"}
              >
                <Moon size={15} /> Dark
              </button>
            </div>
          </div>
        </section>

        <aside className="appearance-preview-column">
          <div className="preview-heading">
            <div>
              <p className="eyebrow">IN REAL TIME</p>
              <h2>Live preview</h2>
            </div>
            <span className="preview-live-indicator">
              <span /> Live
            </span>
          </div>

          <div
            className={`school-preview ${draft.mode === "DARK" ? "dark" : ""}`}
            style={applyPreviewTheme(draft)}
          >
            <div className="school-preview-topbar">
              <div className="school-preview-brand">
                <div className="school-preview-logo">
                  <span>H</span>
                </div>
                <div>
                  <strong>Your School</strong>
                  <small>Learning portal</small>
                </div>
              </div>
              <div className="school-preview-avatar">ST</div>
            </div>

            <div className="school-preview-nav">
              <span className="active">Home</span>
              <span>My classes</span>
              <span>Reports</span>
            </div>

            <div className="school-preview-content">
              <div className="school-preview-welcome">
                <span className="school-preview-pill">STUDENT PORTAL</span>
                <h3>Welcome back!</h3>
                <p>Your learning journey continues here.</p>
                <button type="button">
                  View my classes <span>→</span>
                </button>
                <div className="preview-decoration preview-decoration-one" />
                <div className="preview-decoration preview-decoration-two" />
              </div>

              <div className="school-preview-section-title">
                <strong>Your subjects</strong>
                <span>View all</span>
              </div>

              <div className="school-preview-subjects">
                {[
                  { name: "Mathematics", label: "MAT", icon: "∑" },
                  { name: "Science", label: "SCI", icon: "⚛" },
                  { name: "ICT", label: "ICT", icon: "⌘" },
                ].map((subject) => (
                  <div className="school-preview-subject" key={subject.label}>
                    <span className="school-preview-subject-icon">
                      {subject.icon}
                    </span>
                    <strong>{subject.name}</strong>
                    <small>{subject.label}</small>
                  </div>
                ))}
              </div>

              <div className="school-preview-progress">
                <div>
                  <span>Term progress</span>
                  <strong>68%</strong>
                </div>
                <div className="school-preview-progress-track">
                  <span />
                </div>
              </div>
            </div>
          </div>

          <div className="preview-caption">
            <CheckCircle2 size={16} />
            <span>Your changes appear here before you save them.</span>
          </div>

          <div className="preview-colour-summary">
            <h3>Current palette</h3>
            <div className="preview-colour-chips">
              {[
                ["Brand", draft.primaryColor],
                ["Secondary", draft.secondaryColor],
                ["Highlight", draft.accentColor],
                ["Background", applyMode(draft).pageBackground],
              ].map(([label, color]) => (
                <div key={label} className="preview-colour-chip">
                  <span style={{ backgroundColor: color }} />
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
    {confirmationCopy && <ConfirmActionModal
      title={confirmationCopy.title}
      message={confirmationCopy.message}
      confirmLabel={confirmationCopy.confirmLabel}
      tone={confirmationCopy.tone}
      onCancel={() => setPendingConfirmation("")}
      onConfirm={confirmAppearanceAction}
    />}
    </>
  );
}
