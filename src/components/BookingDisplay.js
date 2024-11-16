import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import SignIn from "./Signin.js";

export default function BookingDisplayMain() {
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [selectedAesthetician, setSelectedAesthetician] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [aestheticians, setAestheticians] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [staffError, setStaffError] = useState("");
  const [procedureItemMap, setProcedureItemMap] = useState({});
  const [cartId, setCartId] = useState("");
  const [appointmentcartId, setAppointmentCartId] = useState("");
  const [timebookedid, setTimeBookedId] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const firstVisitRef = useRef(null);
  const procedureRef = useRef(null);
  const aestheticianRef = useRef(null);
  const dateTimeRef = useRef(null);
  const personalInfoRef = useRef(null);
  const confirmationRef = useRef(null);
  const [staffVariantMap, setStaffVariantMap] = useState({});
  const [selectedStaffVariantId, setSelectedStaffVariantId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedTimeId, setSelectedTimeId] = useState("");

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isFirstVisit !== null) {
      scrollToRef(isFirstVisit ? personalInfoRef : procedureRef);
      if (isFirstVisit === false) {
        setIsSignInOpen(true);
      }
    }
  }, [isFirstVisit]);

  useEffect(() => {
    if (clientId) {
      setIsSignedIn(true);
      setIsSignInOpen(false); // Close sign-in modal after successful sign-in
    }
  }, [clientId]);
  useEffect(() => {
    if (isFirstVisit !== null) {
      scrollToRef(isFirstVisit ? personalInfoRef : procedureRef);
    }
  }, [isFirstVisit]);

  useEffect(() => {
    if (selectedProcedure && !isFirstVisit) {
      scrollToRef(aestheticianRef);
    }
  }, [selectedProcedure, isFirstVisit]);

  useEffect(() => {
    if (selectedAesthetician && !isFirstVisit) {
      scrollToRef(dateTimeRef);
    }
  }, [selectedAesthetician, isFirstVisit]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      scrollToRef(personalInfoRef);
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    const fetchAppointmentData = async (retryCount = 5) => {
      let extractedClientId;
      if (!isFirstVisit) {
        extractedClientId = clientId.split(":").pop();
        console.log("extracted id: ", extractedClientId);
      }

      try {
        const response = await fetch(
          "https://api.vibrantlifespa.com:8001/createAppoinmentCart",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              locationId:
                "urn:blvd:Location:90184c75-0c8b-48d8-8a8a-39c9a22e6099",
              clientId: isFirstVisit
                ? "00f42824-4154-4e07-8240-e694d2c2a7c7"
                : extractedClientId,
            }),
          },
        );

        // Check if the response is okay (status code 200-299)
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("data: ", data);

        const { availableCategories, id: newCartId } =
          data.data?.data?.createCart?.cart || {};
        setCartId(newCartId); // Store the cart ID

        if (Array.isArray(availableCategories)) {
          // Filter out the unwanted categories by name
          const filteredCategories = availableCategories.filter(
            (category) =>
              ![
                "Add-on",
                "Investor's family & Staffs Pricing",
                "Memberships",
                "Gift Cards",
              ].includes(category.name),
          );

          const procedures = filteredCategories.map(
            (category) => category.name,
          );

          // Create maps for items and staff variants
          const procedureMap = {};
          const staffMap = {};

          filteredCategories.forEach((category) => {
            if (category.availableItems && category.availableItems.length > 0) {
              const item = category.availableItems[0];
              procedureMap[category.name] = {
                itemId: item.id,
                name: item.name,
              };

              if (item.staffVariants) {
                item.staffVariants.forEach((variant) => {
                  staffMap[variant.staff.displayName] = variant.id;
                });
              }
            }
          });

          const aestheticians = Object.keys(staffMap);

          setProcedures(procedures);
          setAestheticians(aestheticians);
          setProcedureItemMap(procedureMap);
          setStaffVariantMap(staffMap);

          console.log("procedureItemMap:", procedureMap);
          console.log("staffVariantMap:", staffMap);
        }
      } catch (error) {
        console.error("Error fetching appointment data:", error);

        if (retryCount > 0) {
          console.log(`Retrying... attempts left: ${retryCount}`);
          setTimeout(() => fetchAppointmentData(retryCount - 1), 2000); // Retry after 2 seconds
        } else {
          console.error("Failed after multiple attempts");
        }
      }
    };

    if (isFirstVisit === true || (isFirstVisit === false && clientId)) {
      fetchAppointmentData();
    }
  }, [isFirstVisit, clientId]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!appointmentcartId) return;
      setIsLoadingDates(true);

      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 56);

      const requestBody = {
        cartId: appointmentcartId,
        searchRangeLower: formatDateToString(today),
        searchRangeUpper: formatDateToString(twoWeeksLater),
      };

      try {
        const response = await fetch(
          "https://api.vibrantlifespa.com:8001/appointmentAvailableDatesSlots",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        const result = await response.json();
        if (result.status && result.data?.data?.cartBookableDates) {
          const dates = result.data.data.cartBookableDates.map(
            (slot) => slot.date,
          );
          setAvailableDates(dates);
          console.log("Available dates:", dates);
        }
      } catch (error) {
        console.error("Error fetching available dates:", error);
      } finally {
        setIsLoadingDates(false);
      }
    };

    fetchAvailableDates();
  }, [appointmentcartId, aestheticians]);

  const formatDateToString = (date) => {
    return date.toISOString().split("T")[0];
  };

  const getDaysInMonth = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const days = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const dayDate = new Date(year, monthIndex, date);
      days.push({
        date: dayDate,
        dateString: formatDateToString(dayDate),
      });
    }

    return days;
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)),
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)),
    );
  };
  // When rendering dates:
  const handleDateClick = async (selectedDate) => {
    console.log("Selected date:", selectedDate);
    if (!selectedDate || !cartId) return;

    // Format the date to 'YYYY-MM-DD'
    const formattedDate = new Date(selectedDate).toISOString().split("T")[0];
    console.log("Formatted date:", formattedDate);

    setSelectedDate(selectedDate);
    console.log("Selected date:", selectedDate);
    setSelectedTime(""); // Reset selected time when date changes
    setIsLoadingTimeSlots(true);

    try {
      const response = await fetch(
        "https://api.vibrantlifespa.com:8001/appointmentAvailableTimeSlots",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartId: appointmentcartId,
            date: formattedDate, // Use the formatted date here
          }),
        },
      );
      console.log("body sending to api: ", appointmentcartId, formattedDate);
      const result = await response.json();
      console.log("time result:", result);

      if (result.status && result.data?.data?.cartBookableTimes) {
        const timeSlots = result.data.data.cartBookableTimes.map((slot) => {
          const startTime = new Date(slot.startTime); // This converts the time with the timezone offset
          return {
            id: slot.id,
            time: startTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Local time zone of user
            }),
          };
        });
        setAvailableTimeSlots(timeSlots);
      }
    } catch (error) {
      console.error("Error fetching available time slots:", error);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Split the full name
    const nameParts = firstName.trim().split(" ");

    let updatedFirstName, updatedLastName;

    if (nameParts.length === 1) {
      // If only one word is entered, assign it to both first and last name
      updatedFirstName = nameParts[0] || "";
      updatedLastName = nameParts[0] || ""; // Use the same for last name
    } else {
      // Otherwise, split normally
      updatedFirstName = nameParts[0] || "";
      updatedLastName = nameParts.slice(1).join(" ") || "";
    }

    // Update the state with the new names
    setFirstName(updatedFirstName);
    setLastName(updatedLastName);

    console.log("first name: ", updatedFirstName);
    console.log("last name: ", updatedLastName);

    // Format phone number to digits only and ensure it is in the correct format (+ country code)
    let formattedPhoneNumber = mobile.replace(/[^\d]/g, ""); // Removes anything that's not a number

    // Check if the phone number has the correct length for your country (adjust based on region)
    if (formattedPhoneNumber.length === 10) {
      // Assuming a local number format
      formattedPhoneNumber = `+1${formattedPhoneNumber}`; // Adding country code for US
    }

    // Check if all personal information fields are filled
    if (!updatedFirstName || !updatedLastName || !email || !mobile) {
      alert("Please fill out all personal information fields.");
      return;
    }

    // Prepare the request body for client creation
    const requestBody = {
      email,
      dob: "1990-01-01",
      externalId: email,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      mobilePhone: formattedPhoneNumber, // Use the correctly formatted phone number
      pronoun: "Mr/Mrs",
    };
    console.log("request body: ", requestBody);

    try {
      if (isFirstVisit) {
        // For first-time users, create a new client
        const createClientResponse = await fetch(
          "https://api.vibrantlifespa.com:8001/createClient",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );
        console.log(createClientResponse);
        if (!createClientResponse.ok) {
          throw new Error("Failed to create client");
        }

        const clientData = await createClientResponse.json();
        console.log("Client created: ", clientData);

        const clientInfoRequestBody = {
          cartId: appointmentcartId,
          clientInformation: {
            email: email,
            firstName: updatedFirstName,
            lastName: updatedLastName,
            phoneNumber: formattedPhoneNumber,
          },
        };
        console.log("client info request body: ", clientInfoRequestBody);

        const clientInfoResponse = await fetch(
          "https://api.vibrantlifespa.com:8001/addClientInfoToAppoinmentCart",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(clientInfoRequestBody),
          },
        );

        if (!clientInfoResponse.ok) {
          throw new Error("Failed to add client info to appointment cart");
        }

        const clientInfoData = await clientInfoResponse.json();
        console.log("Client Info response(first time user):", clientInfoData);

        // After client creation, checkout the appointment cart for first-time users
        const checkoutResponse = await fetch(
          "https://api.vibrantlifespa.com:8001/checkoutAppoinmentCart",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cartId: timebookedid,
            }),
          },
        );

        if (!checkoutResponse.ok) {
          throw new Error(
            "Failed to checkout appointment cart for first-time user",
          );
        }

        const checkoutData = await checkoutResponse.json();
        console.log("Checkout response (First-time user):", checkoutData);
      } else {
        // For existing users, just checkout the appointment cart
        const checkoutResponse = await fetch(
          "https://api.vibrantlifespa.com:8001/checkoutAppoinmentCart",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cartId: timebookedid,
            }),
          },
        );

        if (!checkoutResponse.ok) {
          throw new Error(
            "Failed to checkout appointment cart for existing user",
          );
        }

        const checkoutData = await checkoutResponse.json();
        console.log("Checkout response (Existing user):", checkoutData);
      }

      // Add client info to the appointment cart after creating/checking out the cart
      const clientInfoRequestBody = {
        cartId: appointmentcartId,
        clientInformation: {
          email: email,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          phoneNumber: formattedPhoneNumber,
        },
      };
      console.log("client info request body: ", clientInfoRequestBody);

      const clientInfoResponse = await fetch(
        "https://api.vibrantlifespa.com:8001/addClientInfoToAppoinmentCart",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientInfoRequestBody),
        },
      );

      if (!clientInfoResponse.ok) {
        throw new Error("Failed to add client info to appointment cart");
      }

      const clientInfoData = await clientInfoResponse.json();
      console.log("Client Info response:", clientInfoData);

      // If everything is successful, show confirmation and trigger confetti
      setIsConfirmed(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#5FD4D0"],
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        "There was an error processing your appointment. Please try again.",
      );
    }
  };

  const handleTimeSelection = async (time, timeId) => {
    setSelectedTime(time);
    setSelectedTimeId(timeId);
    console.log("Selected time id:", timeId);

    try {
      const response = await fetch(
        "https://api.vibrantlifespa.com:8001/addSelectedTimeToCart",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartId: appointmentcartId,
            bookableTimeId: timeId,
          }),
        },
      );

      const data = await response.json();
      console.log("Add selected time to cart response:", data);
      console.log(
        "time added id: ",
        data.data.data.reserveCartBookableItems.cart.id,
      );
      setTimeBookedId(data.data.data.reserveCartBookableItems.cart.id);

      if (!response.ok) {
        throw new Error("Failed to add selected time to cart");
      }
    } catch (error) {
      console.error("Error adding selected time to cart:", error);
      // Optionally reset the selection if the API call fails
      setSelectedTime("");
      setSelectedTimeId("");
    }
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleEditAppointment = () => {
    setIsConfirmed(false);
    scrollToRef(firstVisitRef);
  };

  const handleProcedureChange = (e) => {
    const selectedProcedure = e.target.value;
    setSelectedProcedure(selectedProcedure);

    // Get the itemId for the selected procedure
    const itemInfo = procedureItemMap[selectedProcedure];
    if (itemInfo) {
      setSelectedItemId(itemInfo.itemId);
      console.log("Selected item ID:", itemInfo.itemId);
    } else {
      setSelectedItemId("");
    }
  };

  const handleAestheticianChange = async (e) => {
    const selectedStaff = e.target.value;
    setSelectedAesthetician(selectedStaff);

    // Get the staff variant ID
    const variantId = staffVariantMap[selectedStaff];
    setSelectedStaffVariantId(variantId);
    console.log("Selected staff variant ID:", variantId);

    if (variantId && selectedItemId && cartId) {
      try {
        const response = await fetch(
          "https://api.vibrantlifespa.com:8001/addItemtoAppoinmentCart",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cartId: cartId,
              itemId: selectedItemId,
              itemStaffVariantId: variantId,
            }),
          },
        );
        console.log("body sending to api: ", cartId, selectedItemId, variantId);
        const data = await response.json();
        console.log("Add item to cart response:", data);
        if (
          data.data?.errors &&
          data.data.errors.length > 0 &&
          data.data.errors[0]?.message
        ) {
          setStaffError(
            "This Aesthetician is not available for the selected procedure. Kindly choose another Aesthetician.",
          );
        } else {
          setStaffError("");
          setAppointmentCartId(
            data.data?.data?.addCartSelectedBookableItem?.cart.id,
          );
        }
        console.log("Appointment cart id:", appointmentcartId);
      } catch (error) {
        console.error("Error adding item to cart:", error);
      }
    }
  };

  if (isConfirmed) {
    return (
      <div className="font-[GeistSans,'GeistSans Fallback'] max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-teal-500">
          Thank You! We look forward to seeing you:
        </h1>
        <div className="space-y-4">
          <p>
            Name:<strong> {firstName} </strong>
          </p>
          <p>
            Mobile:<strong> {mobile} </strong>
          </p>
          <p>
            {isFirstVisit ? "Initial consultation: " : `Procedure: `}
            <strong>{selectedProcedure}</strong>
          </p>
          {!isFirstVisit && (
            <p>
              Aesthetician:<strong> {selectedAesthetician} </strong>{" "}
            </p>
          )}
          <p>
            Date:<strong> {selectedDate?.toLocaleDateString()} </strong>{" "}
          </p>
          <p>
            Time:<strong> {selectedTime} </strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isSignInOpen && (
        <div className="font-[GeistSans,'GeistSans Fallback'] fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-10">
          <div
            className="rounded-lg w-full max-w-md transform transition-all duration-700 scale-0 opacity-0 ease-out"
            style={{
              transition: "transform 0.7s ease-out, opacity 0.7s ease-out",
              transform: isSignInOpen ? "scale(1)" : "scale(0)",
              opacity: isSignInOpen ? "1" : "0",
            }}
          >
            <SignIn
              setClientId={setClientId}
              onClose={() => setIsSignInOpen(false)}
            />
          </div>
        </div>
      )}
      <div className="font-[GeistSans,'GeistSans Fallback'] min-h-screen w-full flex items-center justify-center bg-gray-50 py-10 px-4">
        <div className="w-[350px]  mx-auto p-[1.5rem] bg-white rounded-lg shadow-lg space-y-8">
          <h1 className="text-2xl font-bold mb-6 text-center" data-id="18">
            Let's get you scheduled
          </h1>
          {isSignedIn ? (
            <h2 className="text-lg font-semibold mb-4 text-center">Welcome!</h2>
          ) : (
            <div ref={firstVisitRef}>
              <h2 className="text-lg mb-4">Is this your first visit?</h2>
              <div className="flex justify-center space-x-4">
                {/* <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap 
              rounded-md text-sm font-medium ring-offset-background 
              transition-colors focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-ring focus-visible:ring-offset-2 
              disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 
              [&amp;_svg]:shrink-0 h-10 px-4 py-2 bg-[#5FD4D0] hover:bg-[#5FD4D0]/90 text-white" data-id="22">
                Yes
                </button> */}
                <button
                  onClick={() => {
                    setIsFirstVisit(true);
                    setIsSignedIn(false);
                    setClientId(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap 
              rounded-md text-sm font-medium ring-offset-background 
              transition-colors focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-ring focus-visible:ring-offset-2 
              disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 
              [&_svg]:shrink-0 h-10 px-4 py-2 bg-[#5FD4D0] hover:bg-[#5FD4D0]/90 text-white"
                  data-id="22"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    setIsFirstVisit(false);
                    setIsSignedIn(false);
                    setClientId(null);
                    setIsSignInOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap 
                  rounded-md text-sm font-medium ring-offset-background 
                  transition-colors focus-visible:outline-none focus-visible:ring-2 
                  focus-visible:ring-ring focus-visible:ring-offset-2 
                  disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 
                  [&_svg]:shrink-0 h-10 px-4 py-2 bg-[#5FD4D0] hover:bg-[#5FD4D0]/90 text-white"
                  data-id="22"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Only show procedure selection after first visit choice is made */}
          {(isFirstVisit === true || (isFirstVisit === false && clientId)) && (
            <div
              ref={procedureRef}
              className="mb-4 transition-opacity duration-500 ease-in-out opacity-100"
            >
              <label
                htmlFor="procedure"
                className="text-lg font-semibold block"
              >
                Select Procedure
              </label>
              <div className="relative">
                <select
                  id="procedure"
                  value={selectedProcedure}
                  onChange={handleProcedureChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="text-muted-foreground">
                    Choose a Procedure
                  </option>
                  {procedures.map((procedure) => (
                    <option
                      key={procedure}
                      value={procedure}
                      className="text-sm text-foreground"
                    >
                      {procedure}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedProcedure && (
            <div
              ref={aestheticianRef}
              className={`mb-4 transition-opacity duration-700 ease-in-out ${selectedProcedure ? "opacity-100" : "opacity-0"}`}
            >
              {staffError && (
                <div className="text-red-500 text-sm mb-4">{staffError}</div>
              )}
              <label
                htmlFor="aesthetician"
                className="text-lg font-semibold block"
              >
                Select Aesthetician
              </label>
              <div className="relative">
                <select
                  id="aesthetician"
                  value={selectedAesthetician}
                  onChange={handleAestheticianChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="text-muted-foreground">
                    Choose an Aesthetician
                  </option>
                  {aestheticians.map((aesthetician) => (
                    <option
                      key={aesthetician}
                      value={aesthetician}
                      className="text-sm text-foreground"
                    >
                      {aesthetician}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedProcedure && selectedAesthetician && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-4">Select Date</h2>

              {/* Month navigation */}
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="rounded hover:bg-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="font-[GeistSans,'GeistSans Fallback'] text-sm font-medium">
                  {currentMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="rounded hover:bg-gray-300 "
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Days of the week header */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-3 text-center ">
                {getDaysInMonth(currentMonth).map((dayInfo, idx) => (
                  <div key={idx} className="">
                    {dayInfo ? (
                      <button
                        className={` flex items-center justify-center rounded-md 
        ${availableDates.includes(dayInfo.dateString) ? "font-bold" : ""} 
${
  selectedDate && dayInfo.date.toDateString() === selectedDate.toDateString()
    ? "bg-[#5FD4D0] text-white" // Selected state
    : "hover:bg-red-500 hover:text-red-500" // Using Tailwind's predefined red color
}
        ${!availableDates.includes(dayInfo.dateString) ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() =>
                          dayInfo &&
                          availableDates.includes(dayInfo.dateString) &&
                          handleDateClick(dayInfo.date)
                        }
                      >
                        <span className="border p-[2.5px] border-[#d9d9d9] rounded-md text-[13px]  hover:bg-[#d9d9d9] hover:text-[black] min-w-7">
                          {dayInfo.date.getDate()}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[red]">&nbsp;</span>
                    )}
                  </div>
                ))}
              </div>

              <h2 className="text-lg font-semibold mt-4 mb-2">Select Time</h2>
              <div className="space-y-4">
                {isLoadingTimeSlots ? (
                  <div className="text-center py-4">
                    Loading available times...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleTimeSelection(slot.time, slot.id)}
                        className={`w-full p-2 text-sm rounded-lg transition-colors duration-200
                ${selectedTime === slot.time ? "bg-[#5FD4D0] text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
                {!isLoadingTimeSlots &&
                  availableTimeSlots.length === 0 &&
                  selectedDate && (
                    <p className="text-center text-gray-500">
                      No available time slots for this date. Kindly select
                      another date
                    </p>
                  )}
              </div>
            </div>
          )}

          {selectedDate &&
            selectedTime &&
            (isFirstVisit === true || selectedProcedure) && (
              <div ref={personalInfoRef}>
                <h2 className="text-lg font-semibold mb-2">Your Information</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-black"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-black"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-sm font-medium text-black"
                    >
                      Mobile Number
                    </label>
                    <input
                      id="mobile"
                      type="text"
                      value={mobile}
                      onChange={(e) =>
                        setMobile(formatPhoneNumber(e.target.value))
                      }
                      placeholder="(123) 456-7890"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* Real-time display of entered information */}
                  <div className="mt-4 pt-4 text-black rounded">
                    <h3 className="text-lg  mb-2 font-semibold">
                      Your Appointment
                    </h3>

                    <p className="text-black">
                      Name: {firstName || "Not provided"}
                    </p>
                    <p>Email: {email || "Not provided"}</p>
                    <p>Mobile Number: {mobile || "Not provided"}</p>
                    {!isFirstVisit && (
                      <>
                        <p>Procedure: {selectedProcedure}</p>
                        <p>Aesthetician: {selectedAesthetician}</p>
                      </>
                    )}
                    <p>Date: {selectedDate?.toLocaleDateString()}</p>
                    <p>Time: {selectedTime}</p>
                  </div>
                  <button
                    type="submit"
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full mt-4 bg-[#5FD4D0] hover:bg-[#5FD4D0]/90 text-white 
  ${!firstName || !email || !mobile ? "disabled:opacity-50 disabled:cursor-not-allowed" : ""}`}
                    disabled={!firstName || !email || !mobile}
                  >
                    Schedule Now
                  </button>
                </form>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
