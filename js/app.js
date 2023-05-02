function startApp() {
  const selectCategories = document.querySelector('#categorias');
  if (selectCategories) {
    selectCategories.addEventListener('change', selectCategory);
    getCategories();
  }

  const result = document.querySelector('#resultado');
  const modal = new bootstrap.Modal('#modal', {});
  const favoritesDiv = document.querySelector('.favoritos');
  if (favoritesDiv) {
    listFavorites();
  }

  /**
   * The function retrieves a list of meal categories from an API and displays them.
   */
  async function getCategories() {
    const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';

    await fetch(url)
      .then((response) => response.json())
      .then((res) => showCategories(res.categories));
  }

  /**
   * The function adds new option elements to a select element with the id "categorias" based on an array
   * of categories.
   * @param [categories] - An array of objects containing category information. Each object has a
   * property `strCategory` which is a string representing the name of the category.
   */
  function showCategories(categories = []) {
    categories.forEach(({ strCategory }) => {
      const option = document.createElement('OPTION');
      option.value = strCategory;
      option.textContent = strCategory;
      /* is adding a new `option` element to the `select` element with the id `categorias`.*/
      selectCategories.appendChild(option);
    });
  }

  /**
   * The function selects a category and fetches recipes from an API based on that category.
   */
  async function selectCategory({ target }) {
    const category = target.value;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;
    await fetch(url)
      .then((response) => response.json())
      .then((res) => showRecipes(res.meals));
  }

  /**
   * The function creates and displays recipe cards with images, titles, and a button to view the
   * recipe details.
   * @param [recipes] - An array of recipe objects. Each recipe object should have the following
   * properties: idMeal (string), strMeal (string), and strMealThumb (string). If any of these
   * properties are missing, the function will try to use alternative properties (title and img)
   * instead. If the recipes parameter is
   */
  function showRecipes(recipes = []) {
    cleanHtml(result);

    const heading = document.createElement('H2');
    heading.classList.add('text-center', 'text-black', 'my-5');
    heading.textContent = recipes.length ? 'Resultados' : 'No hay resultados';
    result.appendChild(heading);

    recipes.forEach((recipe) => {
      const { idMeal, strMeal, strMealThumb } = recipe;
      const recipeContainer = document.createElement('DIV');
      recipeContainer.classList.add('col-md-4');

      const recipeCard = document.createElement('DIV');
      recipeCard.classList.add('card', 'mb-4');

      const recipeImage = document.createElement('IMG');
      recipeImage.classList.add('card-img-top');
      recipeImage.alt = `Recipe image of ${strMeal ?? recipe.title}`;
      recipeImage.src = strMealThumb ?? recipe.img;

      const recipeCardBody = document.createElement('DIV');
      recipeCardBody.classList.add('card-body');

      const recipeHeading = document.createElement('H3');
      recipeHeading.classList.add('card-title', 'mb-3');
      recipeHeading.textContent = strMeal ?? recipe.title;

      const recipeBtn = document.createElement('BUTTON');
      recipeBtn.classList.add('btn', 'btn-danger', 'w-100');
      recipeBtn.textContent = 'Ver receta';
      recipeBtn.onclick = () => selectRecipe(idMeal ?? recipe.id);

      //Add content con html
      recipeCardBody.appendChild(recipeHeading);
      recipeCardBody.appendChild(recipeBtn);

      recipeCard.appendChild(recipeImage);
      recipeCard.appendChild(recipeCardBody);

      recipeContainer.appendChild(recipeCard);
      result.appendChild(recipeContainer);
    });
  }

  /**
   * The function selects a recipe by its ID and displays it in a modal using data fetched from an API.
   * @param id - The id parameter is a unique identifier for a recipe in the MealDB API. It is used to
   * retrieve information about a specific recipe.
   */
  async function selectRecipe(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    await fetch(url)
      .then((response) => response.json())
      .then((res) => showRecipeModal(res.meals[0]));
  }

  /**
   * The function displays a recipe modal with the recipe's title, image, instructions, and list of
   * ingredients and quantities.
   * @param recipe - an object containing information about a recipe, including its ID, name, image,
   * instructions, and ingredients with their respective quantities.
   */
  function showRecipeModal(recipe) {
    const { idMeal, strInstructions, strMeal, strMealThumb } = recipe;
    const modalTitle = document.querySelector('.modal .modal-title');
    const modalBody = document.querySelector('.modal .modal-body');
    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
         <img class="img-fluid" src="${strMealThumb}" alt="Recipe ${strMeal}"/>
         <h3 class="my-3">Instructions</h3>
         <p>${strInstructions}</p>
         <h3 class="my-3">Ingredientes y Cantidades</h3>
    `;

    modalBody.appendChild(listIngredients(recipe));
    addModalButtons({ id: idMeal, title: strMeal, img: strMealThumb });
    modal.show();
  }

  /**
   * The function creates an unordered list of ingredients and their quantities for a given recipe
   * object.
   * @param recipe - The recipe object contains information about a recipe, including the ingredients
   * and their quantities. The function takes this object as a parameter and creates an unordered list
   * (UL) element with list items (LI) for each ingredient and its quantity. The list is then returned.
   * @returns a dynamically created unordered list (UL) element with list items (LI) containing the
   * ingredients and their quantities for a given recipe object.
   */
  function listIngredients(recipe) {
    const listGroup = document.createElement('UL');
    listGroup.classList.add('list-group');

    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`]) {
        const ingredient = recipe[`strIngredient${i}`];
        const quantity = recipe[`strMeasure${i}`];

        const ingredientLi = document.createElement('LI');
        ingredientLi.classList.add('list-group-item');
        ingredientLi.textContent = `${ingredient} - ${quantity}`;

        listGroup.appendChild(ingredientLi);
      }
    }

    return listGroup;
  }

  /**
   * The function adds two buttons to a modal footer - one to save as a favorite and one to close the
   * modal.
   */
  function addModalButtons(recipe) {
    const modalFooter = document.querySelector('.modal-footer');
    cleanHtml(modalFooter);

    //Buttons
    const btnFavorite = document.createElement('BUTTON');
    btnFavorite.classList.add('btn', 'btn-danger', 'col');
    btnFavorite.textContent = existStorage(recipe.id)
      ? 'Eliminar favorito'
      : 'Guardar favorito';

    btnFavorite.onclick = () => toggleFavorite(recipe, btnFavorite);

    const btnClose = document.createElement('BUTTON');
    btnClose.classList.add('btn', 'btn-secondary', 'col');
    btnClose.textContent = 'Cerrar';
    btnClose.onclick = () => modal.hide();

    modalFooter.appendChild(btnFavorite);
    modalFooter.appendChild(btnClose);
  }

  /**
   * The function toggles the favorite status of a recipe and updates the button text accordingly.
   * @param recipe - an object representing a recipe, likely with properties such as id, name,
   * ingredients, and instructions.
   * @param btn - The "btn" parameter is a reference to the button element that was clicked to trigger
   * the "toggleFavorite" function.
   * @returns nothing (undefined).
   */
  function toggleFavorite(recipe, btn) {
    if (existStorage(recipe.id)) {
      deleteFavorite(recipe.id);
      btn.textContent = 'Guardar favorito';
      showToast('Eliminado correctamente');
      return;
    }
    addFavorite(recipe);
    btn.textContent = 'Eliminar favorito';
    showToast('Agregado correctamente');
  }

  /**
   * This function retrieves a list of favorites from local storage or returns an empty array if none
   * exist.
   * @returns an array of favorite items that are stored in the browser's local storage. If there are
   * no favorites stored, it will return an empty array.
   */
  function getFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
    return favorites;
  }

  /**
   * The function adds a recipe to the user's favorites list stored in local storage.
   * @param recipe - The recipe object that needs to be added to the favorites list.
   */
  function addFavorite(recipe) {
    localStorage.setItem(
      'favorites',
      JSON.stringify([...getFavorites(), recipe])
    );
  }

  /**
   * The function deletes a favorite item from local storage based on its ID.
   * @param id - The id parameter is the unique identifier of the favorite item that needs to be
   * deleted from the favorites list.
   */
  function deleteFavorite(id) {
    const newFavorites = getFavorites().filter(
      (favorite) => favorite.id !== id
    );
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  }

  /**
   * The function checks if a given ID exists in the "favorites" array stored in the browser's local
   * storage.
   * @param id - The parameter `id` is a unique identifier that is used to check if a particular item
   * exists in the `favorites` array stored in the browser's `localStorage`. The function
   * `existStorage` returns a boolean value indicating whether the item with the given `id` exists in
   * the `favorites` array
   * @returns The function `existStorage` is returning a boolean value indicating whether an object
   * with the given `id` exists in the `favorites` array stored in the browser's local storage.
   */
  function existStorage(id) {
    return getFavorites().some((favorite) => favorite.id === id);
  }

  function listFavorites() {
    const favorites = getFavorites();
    if (favorites.length) {
      showRecipes(favorites);
      return;
    }

    const noFavorites = document.createElement('P');
    noFavorites.textContent = 'No hay favoritos aun';
    noFavorites.classlist.add('fs-4', 'text-center', 'font-bold', 'mt-5');
    favoritesDiv.appendChild(noFavorites);
  }

  /**
   * The function showToast displays a Bootstrap toast message with a given message.
   * @param message - The message parameter is a string that represents the text message that will be
   * displayed in the toast notification.
   */
  function showToast(message) {
    const toastDiv = document.querySelector('#toast');
    const toastBody = document.querySelector('.toast-body');

    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = message;
    toast.show();
  }

  /**
   * The function clears all child elements of a given HTML element.
   * @param selector - The selector parameter is expected to be a reference to an HTML element or node
   * that needs to be cleared of its child nodes.
   */
  function cleanHtml(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }
}

document.addEventListener('DOMContentLoaded', startApp);
