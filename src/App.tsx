import type { Component, Ref } from 'solid-js';

import { createSignal, onMount, createUniqueId } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors } from 'chart.js'
import { Line } from 'solid-chartjs'
import styles from './App.module.css';

type Data = {
	year: number,
	value: number,
	principal: number,
	interest: number,
	spending: number
}[];

type NumberInputProps = {
	defaultValue: number,
	name: string,
	ref: Ref<HTMLInputElement>
};

function calculateData(
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	retirementAge: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number
): Data {
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	let principal = startingBalance;
	let interest = 0;
	let spending = 0;
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const monthlySpending = spendingPerYear / 12;
	const data: Data = [];
	while(currentAge < maxAge) {
		data.push({
			year: currentAge,
			value: currentBalance,
			principal,
			interest,
			spending
		});
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			if(currentAge < retirementAge) {
				principal += currentInvestmentPerMonth;
				currentBalance += currentInvestmentPerMonth;
			} else {
				spending += monthlySpending;
				currentBalance -= monthlySpending;
			}
			interest += currentBalance * monthlyInterestRate;
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRatePercent / 100;
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
			{
				label: 'Principal',
				data: data().map(({ principal }) => principal),
			},
			{
				label: 'Interest',
				data: data().map(({ interest }) => interest),
			},
			{
				label: 'Spending',
				data: data().map(({ spending }) => spending),
			},
		],
	});
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		animation: {
			duration: 0,
		},
		scales: {
			y: { min: 0 }
		}
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
			<NumberInput name="Starting age"                   defaultValue={22}      ref={startingAgeInput} />
			<NumberInput name="Starting Balance"               defaultValue={0}       ref={startingBalanceInput} />
			<NumberInput name="Interest Rate (%)"              defaultValue={10}      ref={interestRateInput} />
			<NumberInput name="Retirement Age"                 defaultValue={50}      ref={retirementAgeInput} />
			<NumberInput name="Max Age"                        defaultValue={120}     ref={maxAgeInput} />
			<NumberInput name="Starting Investment Per Month"  defaultValue={500}     ref={startingInvestmentPerMonthInput} />
			<NumberInput name="Investment Increasing Rate (%)" defaultValue={1}    ref={investmentIncreasingRateInput} />
			<NumberInput name="Spending Per Year Input"        defaultValue={100_000} ref={spendingPerYearInput} />
		</div>
		<div class={styles.chart_container} >
			<Line data={chartData()} options={chartOptions} />
		</div>
	</div>;
};

export default App;
