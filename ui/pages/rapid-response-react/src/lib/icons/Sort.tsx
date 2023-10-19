interface Props {
  fill?: string;
  stroke?: string;
  height?: number;
  width?: number;
  className?: string;
}

export function SortIcon(props: Props) {
  return (
    <svg
      className={props.className}
      width={props.width}
      height={props.height}
      viewBox={`0 0 16 16`}
      fill={props.fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="chevron/sort-arrow">
        <g id="Vector">
          <path
            d="M7.9995 11.7242L5.56883 9.2935C5.43883 9.1635 5.2275 9.1635 5.0975 9.2935C4.9675 9.4235 4.9675 9.63483 5.0975 9.76483L7.9995 12.6668L10.9022 9.76416C10.9675 9.69883 10.9995 9.6135 10.9995 9.52816C10.9995 9.44283 10.9668 9.3575 10.9022 9.29216C10.7722 9.16216 10.5608 9.16216 10.4308 9.29216L7.9995 11.7242Z"
            fill={props.fill}
          />
          <path
            d="M8.00001 4.27616L10.4307 6.70683C10.5607 6.83683 10.772 6.83683 10.902 6.70683C11.032 6.57683 11.032 6.3655 10.902 6.2355L8.00001 3.3335L5.09734 6.23616C5.03201 6.3015 5.00001 6.38683 5.00001 6.47216C5.00001 6.55749 5.03268 6.64283 5.09734 6.70816C5.22734 6.83816 5.43868 6.83816 5.56868 6.70816L8.00001 4.27616Z"
            fill={props.fill}
          />
        </g>
      </g>
    </svg>
  );
}

export default SortIcon;
