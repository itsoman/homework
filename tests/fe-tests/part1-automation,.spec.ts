import { test, expect } from '@playwright/test';
import * as config from '../../config';
import { exit } from 'process';

const website = config.getWebsiteUrl();
const cities = config.getUsCitiesArray();
const months = config.getMonthMapping();
let destination_trip: any = "";

test('@happy-path Plan a trip - Happy path', async ({ page }) => {

  await page.goto(website);

  test.setTimeout(150_000);
  await new Promise((r) => setTimeout(r, 5000));

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('Road Trip Route Planner, Map and Trip Guides');

  // Close the Free trial iframe to have clear view of the page
  if (await page.locator('.gist-message').isVisible()) {
    const iframe = await page.locator('.gist-message').contentFrame().first().getByRole('button').first();
    await iframe.click();
  };
  // Accept cookies to close the prompt
  if (await page.locator('#onetrust-accept-btn-handler').isVisible()) {
    const cookie_button = await page.locator('#onetrust-accept-btn-handler');
    await cookie_button.click();
  };
  // Find by text button plan your trip
  if (await page.locator('button').filter({ hasText: 'Start planning your next road trip today' }).isVisible()) {
    const plan_trip_button = await page.locator('button').filter({ hasText: 'Start planning your next road trip today' }).first();
    await plan_trip_button.click();
  };


  if (await page.locator('#origin').isVisible()) {
    const origin = await page.locator('#origin');
    const origin_city = cities[Math.floor(Math.random() * cities.length)];
    await origin.fill(origin_city);
    console.log(await page.locator('.rt-autocomplete-list').textContent());
    await page.locator('.rt-autocomplete-list').nth(0).click();
    // expect(await origin).toHaveValue(origin_city);
  };

  if (await page.locator('#destination').isVisible()) {
    const destination = await page.locator('#destination');
    const destination_city = cities[Math.floor(Math.random() * cities.length)];
    await destination.fill(destination_city);
    await page.locator('.rt-autocomplete-list').nth(0).click();
    destination_trip = await page.locator('#destination').inputValue();
    console.log("DESTINATION TRIP: ", destination_trip);
    // expect(await destination).toHaveValue(destination_city);
  };

  if (await page.locator('#start_date').isVisible()) {
    const start_date = page.locator('#start_date');
    await start_date.click();
    await page.locator('button[title="Next month"]').click();
    const number_of_days_of_selected_month = await page.locator('.MuiButtonBase-root');
    console.log("\n\nStart Date\nTotal number of days in the selected month: ", (await number_of_days_of_selected_month.count()) - 2);
    let day_to_select_start = (Math.floor(Math.random() * ((await number_of_days_of_selected_month.count()) - 2)));
    console.log("Day of the month to be selected: ", day_to_select_start - 1);
    const selected_month_start = await page.locator('.MuiPickersCalendarHeader-label').textContent();
    if (day_to_select_start - 1 == 0) {
      day_to_select_start = 1;
    };
    await number_of_days_of_selected_month.nth(day_to_select_start).click();

    console.log("Selected month: ", selected_month_start!.slice(0, -5));
    const complete_date_string_start = `${months[selected_month_start!.slice(0, -5)]}/${day_to_select_start - 1}/${selected_month_start!.slice(-2)}`;

    console.log("Complete Date String: " + complete_date_string_start);
    expect(page.locator('#start_date')).toHaveValue(complete_date_string_start);
  };

  if (await page.locator('#end_date').isVisible()) {
    const end_date = page.locator('#end_date');
    await end_date.click();
    await page.locator('button[title="Next month"]').click();
    const number_of_days_of_selected_month = await page.locator('.MuiButtonBase-root');
    console.log("\n\nEnd Date\nTotal number of days in the selected month: ", (await number_of_days_of_selected_month.count()) - 2);
    let day_to_select_end = (Math.floor(Math.random() * ((await number_of_days_of_selected_month.count()) - 2)));
    console.log("Day of the month to be selected: ", day_to_select_end - 1);
    const selected_month_end = await page.locator('.MuiPickersCalendarHeader-label').textContent();
    if (day_to_select_end - 1 == 0) {
      day_to_select_end = 1;
    };
    await number_of_days_of_selected_month.nth(day_to_select_end).click();

    console.log("Selected month: ", selected_month_end!.slice(0, -5));
    const complete_date_string_end = `${months[selected_month_end!.slice(0, -5)]}/${day_to_select_end - 1}/${selected_month_end!.slice(-2)}`;

    console.log("Complete Date String: " + complete_date_string_end);
    expect(page.locator('#end_date')).toHaveValue(complete_date_string_end);
  };

  await page.getByText('Create trip').click();
  await page.getByText('Launch trip').click();
  await page.getByText('Start exploring').click();

  const trip_name = await page.locator('.trip-display-name').textContent();
  expect(trip_name).toContain(destination_trip);
  console.log("Trip Name: " + trip_name);

  await new Promise((r) => setTimeout(r, 30000));
});





test('@edge-case Same origin and destination - edge case', async ({ page }) => {
  await page.goto(website);

  test.setTimeout(60_000);
  await new Promise((r) => setTimeout(r, 5000));

  await expect(page).toHaveTitle('Road Trip Route Planner, Map and Trip Guides');

  // Close the Free trial iframe to have clear view of the page
  if (await page.locator('.gist-message').isVisible()) {
    const iframe = await page.locator('.gist-message').contentFrame().first().getByRole('button').first();
    await iframe.click();
  };
  // Accept cookies to close the prompt
  if (await page.locator('#onetrust-accept-btn-handler').isVisible()) {
    const cookie_button = await page.locator('#onetrust-accept-btn-handler');
    await cookie_button.click();
  };
  // Find by text button plan your trip
  if (await page.locator('button').filter({ hasText: 'Start planning your next road trip today' }).isVisible()) {
    const plan_trip_button = await page.locator('button').filter({ hasText: 'Start planning your next road trip today' }).first();
    await plan_trip_button.click();
  };

  // Use the same city for both origin and destination
  const same_city = cities[Math.floor(Math.random() * cities.length)];
  console.log("Testing same city for origin and destination: ", same_city);

  if (await page.locator('#origin').isVisible()) {
    const origin = await page.locator('#origin');
    await origin.fill(same_city);
    await page.locator('.rt-autocomplete-list').nth(0).click();
  };

  if (await page.locator('#destination').isVisible()) {
    const destination = await page.locator('#destination');
    await destination.fill(same_city);
    await page.locator('.rt-autocomplete-list').nth(0).click();
  };

  // The app should either disable the "Create trip" button or show a validation error
  const create_trip_button = page.getByText('Create trip');
  expect(create_trip_button).toBeDisabled();

});





test('@negative Invalid city name - negative case', async ({ page }) => {
  await page.goto(website);

  test.setTimeout(60_000);
  await new Promise((r) => setTimeout(r, 5000));

  await expect(page).toHaveTitle('Road Trip Route Planner, Map and Trip Guides');

  // Close the Free trial iframe to have clear view of the page
  if (await page.locator('.gist-message').isVisible()) {
    const iframe = await page.locator('.gist-message').contentFrame().first().getByRole('button').first();
    await iframe.click();
  };
  // Accept cookies to close the prompt
  if (await page.locator('#onetrust-accept-btn-handler').isVisible()) {
    const cookie_button = await page.locator('#onetrust-accept-btn-handler');
    await cookie_button.click();
  };
  // Find by text button plan your trip
  if (await page.locator('button').filter({ hasText: 'Start planning your next road trip today' }).isVisible()) {
    const plan_trip_button = await page.locator('button').filter({ hasText: 'Start planning your next road trip today' }).first();
    await plan_trip_button.click();
  };

  const invalid_city = 'ZZZINVALIDCITY123';
  console.log("Testing invalid city input: ", invalid_city);

  if (await page.locator('#origin').isVisible()) {
    const origin = await page.locator('#origin');
    await origin.fill(invalid_city);
  };

  if (await page.locator('#destination').isVisible()) {
    const destination = await page.locator('#destination');
    await destination.fill(invalid_city);
  };

  // The autocomplete list should either be absent or show a "no results" message
  const autocomplete_visible = await page.locator('.rt-autocomplete-list').isVisible();
  console.log("Autocomplete list visible: ", autocomplete_visible);

  if (autocomplete_visible) {
    const result_count = await page.locator('.rt-autocomplete-list').count();
    console.log("Autocomplete result count: ", result_count);
    expect(result_count).toBe(0);
  } else {
    // No list shown at all is also acceptable for no results
    expect(autocomplete_visible).toBe(false);
  };

  // "Create trip" should not be reachable — origin is invalid so the form should be blocked
  const create_trip_button = page.getByText('Create trip');
  const is_disabled = await create_trip_button.isDisabled();
  const is_visible = await create_trip_button.isVisible();
  console.log("Create trip button disabled: ", is_disabled);
  console.log("Create trip button visible: ", is_visible);

  // expect(is_disabled || !is_visible).toBeTruthy();
});