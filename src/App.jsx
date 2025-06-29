import React from 'react'
import Search from './components/Search'
import Spinner from './components/spinner'
import MovieCard from './components/MovieCard'
import { useDebounce } from 'use-debounce'
import { useEffect, useState } from 'react'
import { updateSearchCount, getTrendingMovies } from './appwrite'

const API_BASE_URL = 'https://api.themoviedb.org/3/discover/movie?'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
	method: 'GET',
	headers: {
		accept: 'application/json',
		Authorization: `Bearer ${API_KEY}`,
	},
}

const App = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearchTerm] = useDebounce(searchTerm, 500)

	const [errorMessage, setErrorMessage] = useState(null)
	const [movies, setMovies] = useState([])
	const [isLoading, setIsLoading] = useState(false)

	const [trendingMovies, setTrendingMovies] = useState([])
	const [trendingLoading, setTrendingLoading] = useState(false)
	const [trendingError, setTrendingError] = useState(null)

	const fetchMovies = async (query = '') => {
		setIsLoading(true)
		setErrorMessage(null)

		try {
			const endpoint = query
				? `https://api.themoviedb.org/3/search/movie?query=${encodeURI(query)}`
				: `${API_BASE_URL}sort_by=popularity.desc`

			const response = await fetch(endpoint, API_OPTIONS)

			if (!response.ok) {
				throw new Error('Failed to fetch movies')
			}

			const data = await response.json()

			if (data.Response === 'False') {
				setErrorMessage(data.Error || 'Failed to fetch movies')
				setMovies([])
				return
			}

			setMovies(data.results || [])

			if (query && data.results.length > 0) {
				await updateSearchCount(query, data.results[0])
			}
		} catch (err) {
			console.error(`Error fetching movies: ${err}`)
			setErrorMessage('Error fetching movies. Please try again later.')
		} finally {
			setIsLoading(false)
		}
	}

	const loadTrendingMovies = async () => {
		try {
			setTrendingLoading(true)
			const movies = await getTrendingMovies()

			setTrendingMovies(movies)
		} catch (error) {
			console.log(`Error fetching trending movies: ${error}`)
			setTrendingError('Error fetching trending movies. Please try again later.')
		} finally {
			setTrendingLoading(false)
		}
	}

	useEffect(() => {
		fetchMovies(debouncedSearchTerm)
	}, [debouncedSearchTerm])

	useEffect(() => {
		loadTrendingMovies()
	}, []) /* empty dependency array, it only gets called at the start */

	return (
		<main>
			<div className='pattern'></div>
			<div className='wrapper'>
				<header>
					<img
						src='./hero-img.png'
						alt='Hero Banner'
					/>
					<h1>
						Find <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle
					</h1>
					<Search
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
					/>
				</header>

				<section className='all-movies'>
					{trendingMovies.length > 0 && (
						<section className='trending'>
							<h2>Trending Movies</h2>

							{trendingLoading ? (
								<Spinner />
							) : trendingError ? (
								<p className='text-red-500'>{trendingError}</p>
							) : (
								<ul>
									{trendingMovies.map((movie, index) => (
										<li key={movie.$id}>
											<p>{index + 1}</p>
											<img
												src={movie.poster_url}
												alt={movie.title}
											/>
										</li>
									))}
								</ul>
							)}
						</section>
					)}

					<h2>All Movies</h2>

					{isLoading ? (
						<Spinner />
					) : errorMessage ? (
						<p className='text-red-500'>{errorMessage}</p>
					) : (
						<ul>
							{movies.map(movie => (
								<MovieCard
									key={movie.id}
									movie={movie}
								/>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	)
}

export default App
