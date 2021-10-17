(async () => {
  const stripe = require("stripe")(
    "sk_test_BTaHj7SE48ZgE3Ai4zGKuWvN00IxJOW4MG"
  );
  const subscription = await stripe.subscriptions.retrieve(
    "sub_1JjMv6DM3agr02uAhW53fMS3"
  );
  console.log(JSON.stringify(subscription, null, 1));
    console.log(subscription.items.data[0].plan.amount)

})();
