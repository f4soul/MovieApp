/* Подключение к API */
/* Резервный ключ "c00a42bb-f3ca-4225-a80e-eb89e511037e" */
const API_KEY = "f46a3ff7-645d-422b-938c-4ab850430aa8";

/* URL для получения фильмов из подборки */
const API_URL_POPULAR = "https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS&page=";

/* URL для поиска фильмов по ключевым словам */
const API_URL_SEARCH = "https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=";

/* URL для получения информации о фильме (для модального окна) */
const API_URL_MOVIE_DETAILS = "https://kinopoiskapiunofficial.tech/api/v2.2/films/";

/* Создаем ассинхронную функцию для получения массива данных */
getMovies(API_URL_POPULAR);
let isSearchQuery = false;
let currentPage = 1;

async function getMovies(url) {
	const resp = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": API_KEY,
		},
	});
	const respData = await resp.json();
	showMovies(respData);
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
                    <div class="movie-year-status">(${movie.year})</div>
                    <div class="movie_category">
                        ${movie.genres.map((genre) => ` ${genre.genre}`)}
                    </div>
                    ${!isPercentage(movie.rating) && movie.rating !== null ? `
                    <div class="movie_average movie_average-${getClassByRate(movie.rating)}">
                        ${movie.rating}
                    </div>
                    ` : ""}
                </div>`;
			movieElem.addEventListener("click", () => openModal(movie.filmId));
			moviesElem.appendChild(movieElem);
			data.pagesCount = 5;
		}
	});
	/* Показываем кнопку "Загрузить еще", если есть еще страницы с фильмами и убираем кнопку на странице с поисковым запросом */
	if (currentPage <= data.pagesCount && !isSearchQuery) {
		const loadMoreBtn = document.querySelector(".load-more-btn");
		loadMoreBtn.style.display = "block";
	} else {
		loadMoreBtn.style.display = "none";
	}
}

/* Обработчик события при клике на кнопку "Загрузить еще" */
const loadMoreBtn = document.querySelector(".load-more-btn");
loadMoreBtn.addEventListener("click", () => {
	currentPage++;
	getMovies(`${API_URL_POPULAR}${currentPage}`);
});

/* Обработчик события при клике на кнопку "Наверх" */
const btnUp = {
	el: document.querySelector('.btn-up'),
	show() {
		// удалим у кнопки класс btn-up_hide
		this.el.classList.remove('btn-up_hide');
	},
	hide() {
		// добавляем к кнопке класс btn-up_hide
		this.el.classList.add('btn-up_hide');
	},
	addEventListener() {
		// при прокрутке содержимого страницы
		window.addEventListener('scroll', () => {
			// определяем величину прокрутки
			const scrollY = window.scrollY || document.documentElement.scrollTop;
			// если страница прокручена больше чем на 400px, то делаем кнопку видимой, иначе скрываем
			scrollY > 400 ? this.show() : this.hide();
		});
		// при нажатии на кнопку .btn-up
		document.querySelector('.btn-up').onclick = () => {
			// перемещаем в начало страницы
			window.scrollTo({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
		}
	}
}
btnUp.addEventListener();

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
	const moviesElem = document.querySelector(".movies");

	/* Удаление текущих карточек на странице после отправки запроса через форму поиска */
	moviesElem.innerHTML = "";
	if (search.value) {
		isSearchQuery = true; // Устанавливаем переменную isSearchQuery в true, когда выполняется поисковый запрос, чтобы убрать кнопку "Загрузить еще"
		history.pushState(null, null, "/search");
		getMovies(apiSearchUrl);
		search.value = "";
	}
});

/* Создаем модальное окно и наполняем его информацией */
const modalElem = document.querySelector(".modal");

/* Убираем возможность скролла страницы при открытом модальном окне */
function disableScroll() {
	let paddingOffset = window.innerWidth - document.body.offsetWidth + 'px';
	document.body.style.paddingRight = paddingOffset;
	document.body.classList.add("stop-scrolling");
}

async function openModal(id) {
	document.body.classList.add("modal-open");
	const resp = await fetch(API_URL_MOVIE_DETAILS + id, {
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": API_KEY,
		},
	});

	const respData = await resp.json();
	modalElem.classList.add("modal-show");

	disableScroll();

	modalElem.innerHTML = `
<div class="modal_card">
  <div class="modal_button-close">
    <i class="fa-regular fa-circle-xmark fa-xl"></i>
  </div>
  <div class="modal__content--wrapper">
		<div class="modal_movie-content">
			<h2>
				<span class="modal_movie-title">${respData.nameRu}</span>
			</h2>
			<h3>
				<span class="modal_movie-release-year">(${respData.year})</span>
			</h3>
			<ul class="modal_movie-info">
				<li class="modal_movie-genre">
					Жанр: ${respData.genres.map((el) => `<span> ${el.genre}</span>`)}
				</li>
				${respData.filmLength ? `
				<li class="modal_movie-runtime">Время: ${respData.filmLength} минут</li>
				` : ""} ${respData.ratingKinopoisk !== null ? `
				<li>КиноПоиск: ${respData.ratingKinopoisk}</li>
				` : ""} ${respData.ratingImdb !== null ? `
				<li>IMDb: ${respData.ratingImdb}</li>
				` : ""}
				<li>
					<a class="modal_movie-site" target="_blank" href="${respData.webUrl}"
						>Страница фильма</a
					>
				</li>
				${respData.description !== null ? `
				<li class="modal_movie-overview">
					Описание: <br />${respData.description}
				</li>
				` : ""}
			</ul>
		</div>
		<div class="modal_movie-poster">
			<img class="modal_movie-backdrop" src="${respData.posterUrl}" alt="" />
		</div>
	</div>
</div>
`;

	/* Навешиваем обработчик событий при клике на кнопку "Закрыть" */
	const btnClose = document.querySelector(".modal_button-close");
	btnClose.addEventListener("click", () => closeModal());
}

/* Создаем функцию для закрытия модального окна по кнопке "Закрыть" */
function closeModal() {
	document.body.classList.remove("modal-open");
	modalElem.classList.remove("modal-show");
	document.body.classList.remove("stop-scrolling");
	document.body.style.paddingRight = '0px';
}

/* Глобальный обработчик для всей страницы, для закрытия модального окна по клику в любой области */
window.addEventListener("click", (e) => {
	if (e.target === modalElem) {
		e.preventDefault(); // Предотвращаем переход в начало страницы
		closeModal();
	}
});

/* Добавляем возможность закрывать модальное окно по кнопке "esc" */
window.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		closeModal();
	}
});