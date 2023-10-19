interface Props {
  fill?: string;
  stroke?: string;
  height?: number;
  width?: number;
  className?: string;
}

export const CollapseIcon = (props: Props) => (
  <svg
    className={props.className}
    width={props.width}
    height={props.height}
    viewBox={`0 0 24 24`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g id="collapse-panel/horizontal-right-16">
      <g id="Vector">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11 18L18 18L18 6L11 6L11 18ZM18 19C18.5523 19 19 18.5523 19 18L19 6C19 5.44772 18.5523 5 18 5L11 5C10.4477 5 10 5.44772 10 6L10 18C10 18.5523 10.4477 19 11 19L18 19Z"
          fill={props.fill}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.14645 9.14645C5.34171 8.95118 5.65829 8.95118 5.85355 9.14645L8.70711 12L5.85355 14.8536C5.65829 15.0488 5.34171 15.0488 5.14644 14.8536C4.95118 14.6583 4.95118 14.3417 5.14645 14.1464L7.29289 12L5.14645 9.85355C4.95118 9.65829 4.95118 9.34171 5.14645 9.14645Z"
          fill={props.fill}
        />
      </g>
    </g>
  </svg>
);

export default CollapseIcon;
