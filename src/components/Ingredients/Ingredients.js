import React, { useEffect, useCallback, useReducer, useMemo } from "react";

import IngredientForm from "./IngredientForm";
import IngredientList from './IngredientList';
import Search from "./Search";
import ErrorModal from "../UI/ErrorModal";

const ingredientReducer = (currentIngredients, action) => {
    switch (action.type) {
        case 'SET':
            return action.ingredients;
        case 'ADD':
            return [...currentIngredients, action.ingredient];
        case 'DELETE':
            return currentIngredients.filter(ing => ing.id !== action.id);
        default:
            throw new Error('should be one of the first three cases');
    }
};

const httpReducer = (currentHttpState, action) => {
    switch (action.type) {
        case 'SEND':
            return { loading: true, error: null };
        case 'RESPONSE':
            return { ...currentHttpState, loading: false };
        case 'ERROR':
            return { loading: false, error: action.errorMessage };
        case 'CLEAR':
            return { ...currentHttpState, error: null };
        default:
            throw new Error('should be one of the first three cases');
    }
  };

const Ingredients = () => {
    const [userIngredients, dispatch] = useReducer(ingredientReducer, []);
    const [httpState, dispatchHttp] = useReducer(httpReducer, {
        loading: false,
        error: null
    });

    useEffect(() => { console.log('RENDERING...', userIngredients) }, [userIngredients]);

    const filteredIngredientsHandler = useCallback(filteredIngredients => {
        dispatch({ type: 'SET', ingredients: filteredIngredients });
      }, []);

    const addIngredientHandler = useCallback(ingredient => {
        dispatchHttp({ type: 'SEND' });
        fetch(
            "https://ingredient-card-hooks-default-rtdb.firebaseio.com/ingredients.json",
            {
                method: "POST",
                body: JSON.stringify(ingredient),
                headers: { "Content-Type": "application/json" },
            })
            .then(response => {
                dispatchHttp({ type: 'RESPONSE' });
                return response.json;
            })
            .then(responseData => {
                dispatch({
                    type: 'ADD',
                    ingredient: { id: responseData.name, ...ingredient }
                });
            });
    }, []);

    const removeIngredientHandler = useCallback(ingredientId => {
        dispatchHttp({ type: 'SEND' });
        fetch(
            `https://ingredient-card-hooks-default-rtdb.firebaseio.com/ingredients/${ingredientId}.json`,
            {
                method: "DELETE",
            }
        )
        .then((response) => {
            dispatchHttp({ type: 'RESPONSE' });
            dispatch({ type: 'DELETE', id: ingredientId });
        })
        .catch(error => {
            dispatchHttp({ type: 'ERROR', errorMessage: 'Something went wrong!' });
            dispatchHttp({ type: 'RESPONSE' });
          });
    }, []);

    const clearError = useCallback(() => {
        dispatchHttp({ type: 'CLEAR' });
    }, [])

    const ingredientList = useMemo(() => {
        return (
          <IngredientList
            ingredients={userIngredients}
            onRemoveItem={removeIngredientHandler}
          />
        );
    }, [userIngredients, removeIngredientHandler]);

    return (
        <div className="App">
            {httpState.error && <ErrorModal onClose={clearError}>{httpState.error}</ErrorModal>}
            <IngredientForm
                onAddIngredient={addIngredientHandler}
                loading={httpState.loading}
            />
            <section>
                <Search onLoadIngredients={filteredIngredientsHandler} />
                {ingredientList}
            </section>
        </div>
    );
};

export default Ingredients;
