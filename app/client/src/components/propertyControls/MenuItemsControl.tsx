import React, { useCallback, useEffect, useRef, useState } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledPropertyPaneButton,
  StyledDragIcon,
  StyledDeleteIcon,
  StyledEditIcon,
  StyledOptionControlInputGroup,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { getNextEntityName } from "utils/AppsmithUtils";
import _, { debounce, orderBy } from "lodash";
import { Category, Size } from "components/ads/Button";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
`;

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const MenuItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const AddMenuItemButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

type RenderComponentProps = {
  focusedIndex: number | null | undefined;
  index: number;
  isDragging: boolean;
  item: {
    label: string;
    isVisible?: boolean;
  };
  deleteOption: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (props: any) => void;
};

function MenuItemComponent(props: RenderComponentProps) {
  const {
    deleteOption,
    focusedIndex,
    index,
    isDragging,
    item,
    updateFocus,
    updateOption,
  } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(item.label);
  const [isEditing, setEditing] = useState(false);

  useEffect(() => {
    if (!isEditing && item && item.label) setValue(item.label);
  }, [item?.label, isEditing]);

  const debouncedUpdate = debounce(updateOption, 1000);

  useEffect(() => {
    if (focusedIndex !== null && focusedIndex === index && !isDragging) {
      if (ref && ref.current) {
        ref?.current.focus();
      }
    } else if (isDragging && focusedIndex === index) {
      if (ref && ref.current) {
        ref?.current.blur();
      }
    }
  }, [focusedIndex, isDragging]);

  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );
  const handleChange = useCallback(() => props.onEdit && props.onEdit(index), [
    index,
  ]);

  const onFocus = () => {
    setEditing(true);
    if (updateFocus) {
      updateFocus(index, true);
    }
  };

  const onBlur = () => {
    if (!isDragging) {
      setEditing(false);
      if (updateFocus) {
        updateFocus(index, false);
      }
    }
  };
  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder="Menu item label"
        ref={ref}
        value={value}
      />
      <StyledDeleteIcon
        className="t--delete-tab-btn"
        height={20}
        marginRight={12}
        onClick={() => {
          deleteOption(index);
        }}
        width={20}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={handleChange}
        width={20}
      />
    </ItemWrapper>
  );
}

type State = {
  focusedIndex: number | null;
};

class MenuItemsControl extends BaseControl<ControlProps, State> {
  constructor(props: ControlProps) {
    super(props);

    this.state = {
      focusedIndex: null,
    };
  }

  componentDidUpdate(prevProps: ControlProps): void {
    //on adding a new column last column should get focused
    if (
      Object.keys(prevProps.propertyValue).length + 1 ===
      Object.keys(this.props.propertyValue).length
    ) {
      this.updateFocus(Object.keys(this.props.propertyValue).length - 1, true);
    }
  }
  updateItems = (items: Array<Record<string, any>>) => {
    const menuItems = items.reduce((obj: any, each: any, index: number) => {
      obj[each.id] = {
        ...each,
        index,
      };
      return obj;
    }, {});
    this.updateProperty(this.props.propertyName, menuItems);
  };

  onEdit = (index: number) => {
    const menuItems: Array<{
      id: string;
      label: string;
    }> = Object.values(this.props.propertyValue);
    const targetMenuItem = menuItems[index];
    this.props.openNextPanel({
      index,
      ...targetMenuItem,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const menuItems: Array<{
      id: string;
      label: string;
    }> =
      _.isString(this.props.propertyValue) ||
      _.isUndefined(this.props.propertyValue)
        ? []
        : Object.values(this.props.propertyValue);
    return (
      <MenuItemsWrapper>
        <DroppableComponent
          deleteOption={this.deleteOption}
          fixedHeight={370}
          focusedIndex={this.state.focusedIndex}
          itemHeight={45}
          items={orderBy(menuItems, ["index"], ["asc"])}
          onEdit={this.onEdit}
          renderComponent={MenuItemComponent}
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <StyledPropertyPaneButtonWrapper>
          <AddMenuItemButton
            category={Category.tertiary}
            className="t--add-menu-item-btn"
            icon="plus"
            onClick={this.addOption}
            size={Size.medium}
            tag="button"
            text="Add a new Menu Item"
            type="button"
          />
        </StyledPropertyPaneButtonWrapper>
      </MenuItemsWrapper>
    );
  }

  toggleVisibility = (index: number) => {
    const menuItems: Array<{
      id: string;
      label: string;
      isDisabled: boolean;
      isVisible: boolean;
      widgetId: string;
    }> = this.props.propertyValue.slice();
    const isVisible = menuItems[index].isVisible === true ? false : true;
    const updatedMenuItems = menuItems.map((item, itemIndex) => {
      if (index === itemIndex) {
        return {
          ...item,
          isVisible: isVisible,
        };
      }
      return item;
    });
    this.updateProperty(this.props.propertyName, updatedMenuItems);
  };

  deleteOption = (index: number) => {
    const menuItemsArray: any = Object.values(this.props.propertyValue);
    const itemId = menuItemsArray[index].id;
    if (menuItemsArray && menuItemsArray.length === 1) return;
    const updatedArray = menuItemsArray.filter((eachItem: any, i: number) => {
      return i !== index;
    });
    const updatedObj = updatedArray.reduce(
      (obj: any, each: any, index: number) => {
        obj[each.id] = {
          ...each,
          index,
        };
        return obj;
      },
      {},
    );
    this.deleteProperties([`${this.props.propertyName}.${itemId}.isVisible`]);
    this.updateProperty(this.props.propertyName, updatedObj);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const menuItemsArray: any = Object.values(this.props.propertyValue);
    const itemId = menuItemsArray[index].id;
    this.updateProperty(
      `${this.props.propertyName}.${itemId}.label`,
      updatedLabel,
    );
  };

  addOption = () => {
    let menuItems = this.props.propertyValue || [];
    const menuItemsArray = Object.values(menuItems);
    const newMenuItemId = generateReactKey({ prefix: "menuItem" });
    const newMenuItemLabel = getNextEntityName(
      "Menu Item ",
      menuItemsArray.map((menuItem: any) => menuItem.label),
    );
    menuItems = {
      ...menuItems,
      [newMenuItemId]: {
        id: newMenuItemId,
        label: newMenuItemLabel,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
      },
    };

    this.updateProperty(this.props.propertyName, menuItems);
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  static getControlType() {
    return "MENU_ITEMS";
  }
}

export default MenuItemsControl;
