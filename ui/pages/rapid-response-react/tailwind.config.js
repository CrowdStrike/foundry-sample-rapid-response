/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.4s",
        fadeOut: "fadeOut 0.4s",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: 0,
            visibility: "hidden",
          },
          "100%": {
            opacity: 1,
            visibility: "visible",
          },
        },
        fadeOut: {
          "0%": {
            opacity: 1,
            visibility: "visible",
          },
          "100%": {
            opacity: 0,
            visibility: "hidden",
          },
        },
      },
      height: {
        "alljobs-viewport": "calc(100vh - 7rem)",
        "screen-without-header": "calc(100vh - 4.75rem)",
      },
      maxHeight: {
        "alljobs-hosts": "calc(100% - 4.75rem)",
      },
      minHeight: {
        "alljobs-hosts": "calc(100% - 4.75rem)",
      },
      width: {
        42: "164px",
      },
      colors: {
        csaqua: "var(--cs-aqua)",
        cspurple: "#AF4AFF",
        csteal: "var(--cs-teal)",
        mezzanine: "var(--cs-mezzanine)",
        groundfloor: "var(--cs-background)",
        surfaceinner: "var(--cs-surface-inner)",
        csinputbordercolor: "var(--cs-input-color-border)",
        surfacemd: "var(--cs-surfaces-surface-md)",
        surface2xl: "#3d3c40",
        csbackdrop: "var(--cs-backdrop-color)",
        cspopover: "var(--cs-popover-color-background)",
        csdetailsbg: "var(--cs-details-summary-color-background)",
        csinputcolorbg: "var(--cs-input-color-background)",
        cscritical: "var(--cs-input-color-border-invalid)",
        csinputcolorborder: "var(--cs-input-color-border)",
        csbuttonsecondary: "#838497",
        csbuttoncolortext: "var(--cs-button-color-text)",
        csbuttonsecondaryhover:
          "var(--cs-button-color-background-secondary-hover)",
        csbuttonsecondaryactive:
          "var(--cs-button-color-background-secondary-active)",
        cssurfacesinner: "var(--cs-surface-inner)",
        csforegroundtext: "var(--cs-button-color-foreground-secondary)",
        csmezzanine: "#212121",
        cssurface2xl: "var(--cs-surfaces-surface-2-xl)",
        csbuttoncolorbackgroundsecondary:
          "var(--cs-button-color-background-secondary)",
        csprimaryforegroundnextbtn: "var(--cs-button-color-foreground-primary)",
        variantDark: "var(--cs-variant-dark)",
        csbodyandlabels: "var(--cs-body-and-labels)",
        csbuttondisabled: "var(--cs-overlay-dark)",
        cstextdisabled: "var(--cs-button-color-foreground-disabled)",
        cstablecolorborder: "var(--cs-table-color-border)",
        cstablebackgroundeven: "var(--cs-table-row-color-background-even)",
        cstablebackgroundodd: "var(--cs-table-row-color-background-odd)",
        cstransparencyoverlaydarker: "var(--cs-overlay-darker)",
        cstitlesandattributes: "var(--cs-titles-and-attributes)",
        dropfilebgcolor: "rgba(0, 0, 0, 0.13)",
        csmenucolorselected: "var(--cs-table-row-color-background-selected)",
      },
      backgroundImage: (theme) => ({
        cslineargrey: "var(--cs-linear-grey)",
        csbuttonprimary: `linear-gradient(90deg, ${theme(
          "colors.csaqua",
        )} 0%, ${theme("colors.csteal")} 100%)`,
        csbuttonprimaryhover: `var(--cs-linear-teal-hover)`,
        csbuttonprimaryfocus: `var(--cs-linear-teal-pressed)`,
        csstepprimary:
          "var(--linear-2-paints, linear-gradient(90deg, #4CD7F5 0%, #06E5B7 100%), linear-gradient(90deg, #AF4AFF 0%, #6941C6 100%))",
      }),
      boxShadow: {
        containerJobDetails:
          "0px 2px 4px 0px rgba(0, 0, 0, 0.33), 0px 4px 6px 0px rgba(0, 0, 0, 0.10);",
        rowTable: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
        csbutton: "var(--cs-button-shadow)",
        elevation: "var(--cs-shadow-elevation)",
        elevationinset: "0px 2px 4px 0px rgba(0, 0, 0, 0.36) inset",
        bgHeaderCreateJob:
          "0px 1px 3px 0px rgba(0, 0, 0, 0.10), 0px 1px 2px 0px rgba(0, 0, 0, 0.46);",
      },
    },
  },
  plugins: [],
};
