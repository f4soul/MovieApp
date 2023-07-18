/* Подключение к API */
const API_KEY = "f46a3ff7-645d-422b-938c-4ab850430aa8";

/* Запрос к API и получение фильмов из подборки */
let currentPage = 1;
const moviesPerPage = 35;
const API_URL_POPULAR =
	"https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS&page=";

/* Добавление поиска по ключевым словам */
const API_URL_SEARCH =
	"https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=";

/* Запрос к API и получение информации о фильме (для модального окна) */
const API_URL_MOVIE_DETAILS =
	"https://kinopoiskapiunofficial.tech/api/v2.2/films/";

/* Создаем ассинхронную функцию для получения массива данных */
getMovies(API_URL_POPULAR);

/* Создаем ассинхронную функцию для получения массива данных */
async function getMovies(url) {
	const resp = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": API_KEY,
		},
	});
	const respData = await resp.json();
	showMovies(respData);
	currentPage++;
}

/* Создаем функцию для окрашивания рамки поля с оценкой фильма согласно полученному значению */
function getClassByRate(vote) {
	if (vote >= 7) {
		return "green";
	} else if (vote > 5) {
		return "orange";
	} else {
		return "red";
	}
}

/* Создаем функцию для отрисовки карточек фильмов на странице */
function showMovies(data) {
	const moviesElem = document.querySelector(".movies");

	/* Удаление текущих карточек на странице после отправки запроса через форму поиска */
	moviesElem.innerHTML = "";

	/* Создаем карточки фильмов на странице */
	data.films.forEach((movie) => {
		/* Проверяем условия для рейтинга и названия фильма и убираем из поисковой выдачи фильмы, где отсутствует рейтинг или название фильма */
		if (
			movie.rating !== null &&
			movie.nameRu !== undefined &&
			movie.rating !== "null"
		) {
			const movieElem = document.createElement("div");
			movieElem.classList.add("movie");
			movieElem.innerHTML = `
				<div class="movie_cover-inner">
					<img
						src="${movie.posterUrlPreview}"
						alt="${movie.nameRu}"
						class="movie_cover"
					/>
					<div class="movie_cover-hover"></div>
				</div>
				<div class="movie_info">
					<div class="movie_title">${movie.nameRu}</div>
					<div class="movie_category">${movie.genres.map((genre) => ` ${genre.genre}`)}</div>
					${!isPercentage(movie.rating) && movie.rating !== null
					? `<div class="movie_average movie_average-${getClassByRate(movie.rating)}">${movie.rating}</div>`
					: ""}
				</div>`;
			movieElem.addEventListener("click", () => openModal(movie.filmId));
			moviesElem.appendChild(movieElem);
		}
	});
	/* Показываем кнопку "Загрузить еще", если есть еще страницы с фильмами и убираем кнопку на странице с поисковым запросом */
	if (data.pagesCount != 0) {
		const loadMoreBtn = document.querySelector(".load-more-btn");
		loadMoreBtn.style.display = "block";
	}
}

/* Обработчик события при клике на кнопку "Загрузить еще" */
const loadMoreBtn = document.querySelector(".load-more-btn");
loadMoreBtn.addEventListener("click", () => {
	getMovies(`${API_URL_POPULAR}${currentPage}`);
});

/* Функция для проверки входного значения поля "рейтинг" (если возвращается пустое значение, либо значение с %, то рейтинг не выводится в карточку) */
function isPercentage(value) {
	return typeof value === "string" && value.endsWith("%");
}

/* Подключаем форму поиска */
const form = document.querySelector("form");
const search = document.querySelector(".header_search");

/* Подключаем обработчик события на форму и сбрасываем стандартное поведение страницы*/
form.addEventListener("submit", (e) => {
	e.preventDefault();

	/* Формирование поискового запроса и очистка формы после отправки запроса */
	const apiSearchUrl = `${API_URL_SEARCH}${search.value}`;
	if (search.value) {
		getMovies(apiSearchUrl);
		search.value = "";
		loadMoreBtn.style.display = "none" //Убираем кнопку "Загрузить еще" на странице поискового запроса
	}
});

/* Создаем модальное окно и наполняем его информацией */
const modalElem = document.querySelector(".modal");

async function openModal(id) {
	const resp = await fetch(API_URL_MOVIE_DETAILS + id, {
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": API_KEY,
		},
	});

	const respData = await resp.json();
	modalElem.classList.add("modal-show");

	/* Убираем возможность скролла страницы при открытом модальном окне */
	document.body.classList.add("stop-scrolling");

	modalElem.innerHTML = `
		<div class="modal_card">
			<div class="modal_button-close">
				<i class="fa-regular fa-circle-xmark"></i>
			</div>
			<div class="modal_movie-content">
				<h2>
					<span class="modal_movie-title">${respData.nameRu}</span>
					<span class="modal_movie-release-year"> - ${respData.year}</span>
				</h2>
				<ul class="modal_movie-info">
					<li class="modal_movie-genre">
						Жанр - ${respData.genres.map((el) => `<span>${el.genre}</span>`)}
					</li>
					${respData.filmLength ? `<li class="modal_movie-runtime">Время - ${respData.filmLength} минут</li>` : ""}
					${respData.ratingKinopoisk !== null ? `<li>КиноПоиск: ${respData.ratingKinopoisk}</li>` : ""}
					${respData.ratingImdb !== null ? `<li>IMDb: ${respData.ratingImdb}</li>` : ""}
					<li>
						Сайт:
						<a class="modal_movie-site" href="${respData.webUrl}">${respData.webUrl}</a>
					</li>
					${respData.description !== null ? `<li class="modal_movie-overview">Описание - ${respData.description}</li>` : ""}
				</ul>
			</div>
			<div class="modal_movie-poster">
				<img class="modal_movie-backdrop" src="${respData.posterUrl}" alt="" />
			</div>
		</div>`;

	/* Навешиваем обработчик событий при клике на кнопку "Закрыть" */
	const btnClose = document.querySelector(".modal_button-close");
	btnClose.addEventListener("click", () => closeModal());
}

/* Создаем функцию для закрытия модального окна по кнопке "Закрыть" */
function closeModal() {
	modalElem.classList.remove("modal-show");
	document.body.classList.remove("stop-scrolling");
}

/* Глобальный обработчик для всей страницы, для закрытия модального окна по клику в любой области */
window.addEventListener("click", (e) => {
	if (e.target === modalElem) {
		closeModal();
	}
});

/* Добавляем возможность закрывать модальное окно по кнопке "esc" */
window.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		closeModal();
	}
});




