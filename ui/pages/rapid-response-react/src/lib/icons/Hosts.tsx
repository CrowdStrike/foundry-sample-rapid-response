interface Props {
  fill?: string;
  stroke?: string;
  height?: number;
  width?: number;
  className?: string;
}

export const HostsIcon = (props: Props) => (
  <svg
    className={props.className}
    width={props.width}
    height={props.height}
    viewBox={`0 0 24 24`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g id="host-group-24">
      <g id="Vector">
        <path
          d="M15.25 7.97021H1.75C1.34 7.97021 1 8.31022 1 8.72022V15.9702H16V8.72022C16 8.31022 15.66 7.97021 15.25 7.97021ZM10.95 19.7202H6.05L5.08 21.4102C4.94 21.6602 5.12 21.9702 5.4 21.9702H11.6C11.89 21.9702 12.07 21.6602 11.92 21.4102L10.95 19.7202ZM1 18.2202C1 18.6302 1.34 18.9702 1.75 18.9702H15.25C15.66 18.9702 16 18.6302 16 18.2202V16.7202H1V18.2202Z"
          fill={props.fill}
        />
        <path
          d="M18.25 4.97021H4.75C4.34 4.97021 4 5.31021 4 5.72021V5.97021H17C17.55 5.97021 18 6.42021 18 6.97021V15.4702H18.25C18.66 15.4702 19 15.1302 19 14.7202V5.72021C19 5.31021 18.66 4.97021 18.25 4.97021Z"
          fill={props.fill}
        />
        <path
          d="M21.25 1.97021H7.75C7.34 1.97021 7 2.31021 7 2.72021V2.97021H20C20.55 2.97021 21 3.42021 21 3.97021V12.4702H21.25C21.66 12.4702 22 12.1302 22 11.7202V2.72021C22 2.31021 21.66 1.97021 21.25 1.97021Z"
          fill={props.fill}
        />
      </g>
    </g>
  </svg>
);

export default HostsIcon;
