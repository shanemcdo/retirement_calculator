import type { Component, Ref } from 'solid-js';

import { createSignal, onMount, createUniqueId } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors } from 'chart.js'
import { Line } from 'solid-chartjs'
import styles from './App.module.css';

type Data = {
	year: number,
	value: number,
}[];

type NumberInputProps = {
	defaultValue: number,
	name: string,
	ref: Ref<HTMLInputElement>
};

function calculateData(
	startingAge: number,
	startingBalance: number,
	interestRate: number,
	retirementAge: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRate: number,
	spendingPerYear: number
): Data {
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	const monthlyInterestRate = interestRate / 12;
	const monthlySpending = spendingPerYear / 12;
	const data: Data = [];
	const pushData = () => data.push({ year: currentAge, value: currentBalance });
	while(currentAge < maxAge) {
		pushData();
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			currentBalance += currentAge < retirementAge ?  currentInvestmentPerMonth : -monthlySpending;
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRate;
		currentAge += 1;
	}
	return data;
}


const App: Component = () => {
	const url = new URL(window.location.toString());
	const [data, setData] = createSignal<Data>([]);
	let startingAgeInput: HTMLInputElement | undefined;
	let startingBalanceInput: HTMLInputElement | undefined;
	let interestRateInput: HTMLInputElement | undefined;
	let retirementAgeInput: HTMLInputElement | undefined;
	let maxAgeInput: HTMLInputElement | undefined;
	let startingInvestmentPerMonthInput: HTMLInputElement | undefined;
	let investmentIncreasingRateInput: HTMLInputElement | undefined;
	let spendingPerYearInput: HTMLInputElement | undefined;
	const updateData = () => {
		setData(calculateData(
			startingAgeInput!.valueAsNumber,
			startingBalanceInput!.valueAsNumber,
			interestRateInput!.valueAsNumber,
			retirementAgeInput!.valueAsNumber,
			maxAgeInput!.valueAsNumber,
			startingInvestmentPerMonthInput!.valueAsNumber,
			investmentIncreasingRateInput!.valueAsNumber,
			spendingPerYearInput!.valueAsNumber,
		));
	}
	onMount(() => {
		Chart.register(Title, Tooltip, Legend, Colors);
		Chart.defaults.font.family = '"Josefin Sans", sans-serif';
		updateData();
	});
	const chartData = () => ({
		labels: data().map(({ year }) => year),
		datasets: [
			{
				label: 'Retirement Fund',
				data: data().map(({ value }) => value),
			},
		],
	});
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: true,
		animation: {
			duration: 0,
		},
	};
	const NumberInput: Component<NumberInputProps> = props => {
		const id = createUniqueId();
		return <>
			<label for={id} >{ props.name }:</label>
			<input
				type="number"
				value={url.searchParams.get(props.name) ?? props.defaultValue}
				class={styles.number_input}
				ref={props.ref}
				id={id}
				onChange={(e) => {
					if(e.target.valueAsNumber === props.defaultValue) {
						url.searchParams.delete(props.name);
					} else {
						url.searchParams.set(props.name, e.target.value);
					}
					const newurl = url.toString();
					window.history.pushState({ path: newurl },'',newurl);
					updateData();
				}}
			/>
		</>;
	}
	return <div class={styles.app}>
		<h1>Retirement Calculator</h1>
		<div class={styles.grid}>
			<NumberInput name="Starting age"                  defaultValue={22}      ref={startingAgeInput} />
			<NumberInput name="Starting Balance"              defaultValue={0}       ref={startingBalanceInput} />
			<NumberInput name="Interest Rate"                 defaultValue={0.10}    ref={interestRateInput} />
			<NumberInput name="Retirement Age"                defaultValue={50}      ref={retirementAgeInput} />
			<NumberInput name="Max Age"                       defaultValue={120}     ref={maxAgeInput} />
			<NumberInput name="Starting Investment Per Month" defaultValue={500}     ref={startingInvestmentPerMonthInput} />
			<NumberInput name="Investment Increasing Rate"    defaultValue={0.01}    ref={investmentIncreasingRateInput} />
			<NumberInput name="Spending Per Year Input"       defaultValue={100_000} ref={spendingPerYearInput} />
		</div>
		<Line data={chartData()} options={chartOptions} width={3} height={1} />
	</div>;
};

export default App;
