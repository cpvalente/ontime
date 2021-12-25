import PropTypes from "prop-types";
import style from "../../../features/info/Info.module.scss";
import {Icon} from "@chakra-ui/react";
import {FiChevronUp} from "react-icons/fi";

export default function CollapseBar(props) {
  const {title = 'Collapse bar', isCollapsed = false, onClick}= props;

  return(
    <div className={style.header}>
      {title}
      <Icon
        className={isCollapsed ? style.moreCollapsed : style.moreExpanded}
        as={FiChevronUp}
        onClick={onClick}
      />
    </div>
  )
}
CollapseBar.propTypes = {
  title: PropTypes.string,
  isCollapsed: PropTypes.bool,
  onClick: PropTypes.func,
}