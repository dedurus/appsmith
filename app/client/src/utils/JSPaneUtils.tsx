//check difference for after body change and parsing
import { JSAction } from "entities/JSAction";

export const getDifferenceInJSAction = (
  parsedBody: any,
  jsAction: JSAction,
) => {
  jsAction.variables = parsedBody.variables;
  const newActions: any = [];
  const archivedActions = [];
  //check if body is changed and update if exists or
  // add to new array so it can be added to main collection
  for (let i = 0; i < parsedBody.actions.length; i++) {
    const action = parsedBody.actions[i];
    const preExisted = jsAction.actions.find((js) => js.name === action.name);
    if (preExisted) {
      preExisted.actionConfiguration.body = action.body;
      preExisted.actionConfiguration.jsArguments = action.arguments;
    } else {
      newActions.push(action);
    }
  }
  //create deleted action list
  for (let i = 0; i < jsAction.actions.length; i++) {
    const preAction = jsAction.actions[i];
    const existed = parsedBody.actions.find(
      (js: any) => js.name === preAction.name,
    );
    if (!existed) {
      archivedActions.push(preAction);
    }
  }
  //check if new is name changed from deleted actions
  if (archivedActions.length && newActions.length) {
    for (let i = 0; i < newActions.length; i++) {
      const nameChange = archivedActions.find(
        (js) => js.actionConfiguration.body === newActions[i].body,
      );
      if (nameChange) {
        const updateExisting = jsAction.actions.find(
          (js) => js.actionId === nameChange.actionId,
        );
        if (updateExisting) {
          const indexOfArchived = archivedActions.findIndex((js) => {
            js.actionId === updateExisting.actionId;
          });
          updateExisting.name = newActions[i].name;
          newActions.splice(i, 1);
          archivedActions.splice(indexOfArchived, 1);
        }
      }
    }
  }

  if (newActions.length > 0) {
    for (let i = 0; i < newActions.length; i++) {
      const action = newActions[i];
      const obj = {
        name: action.name,
        collectionId: jsAction.id,
        actionId: action.name,
        executeOnLoad: false,
        actionConfiguration: {
          body: action.body,
          isAsync: false,
          timeoutInMilliseconds: 0,
        },
      };
      jsAction.actions.push(obj);
    }
  }
  if (archivedActions.length > 0) {
    for (let i = 0; i < archivedActions.length; i++) {
      const action = archivedActions[i];
      const deleteArchived = jsAction.actions.findIndex((js) => {
        action.actionId === js.actionId;
      });
      jsAction.actions.splice(deleteArchived, 1);
    }
  }
  return jsAction;
};
