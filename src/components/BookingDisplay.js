import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import SignIn from './Signin.js';


export default function BookingDisplayMain() {
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [selectedAesthetician, setSelectedAesthetician] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [pronoun, setPronoun] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [aestheticians, setAestheticians] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [staffError, setStaffError] = useState('');
  const [procedureItemMap, setProcedureItemMap] = useState({});
  const [cartId, setCartId] = useState('');
  const [appointmentcartId, setAppointmentCartId] = useState('');
  const [timebookedid, setTimeBookedId] = useState('');
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
  const [selectedStaffVariantId, setSelectedStaffVariantId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedTimeId, setSelectedTimeId] = useState('');

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
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
        extractedClientId = clientId.split(':').pop();
        console.log("extracted id: ", extractedClientId);
      }

      try {
        const response = await fetch('http://localhost:8000/createAppoinmentCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationId: 'urn:blvd:Location:90184c75-0c8b-48d8-8a8a-39c9a22e6099',
            clientId: isFirstVisit ? '00f42824-4154-4e07-8240-e694d2c2a7c7' : extractedClientId
          }),
        });

        // Check if the response is okay (status code 200-299)
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("data: ", data);

        const { availableCategories, id: newCartId } = data.data?.data?.createCart?.cart || {};
        setCartId(newCartId); // Store the cart ID

        if (Array.isArray(availableCategories)) {
          // Filter out the unwanted categories by name
          const filteredCategories = availableCategories.filter(category =>
            !['Add-on', "Investor's family & Staffs Pricing", 'Memberships', 'Gift Cards'].includes(category.name)
          );

          const procedures = filteredCategories.map((category) => category.name);

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
        console.error('Error fetching appointment data:', error);

        if (retryCount > 0) {
          console.log(`Retrying... attempts left: ${retryCount}`);
          setTimeout(() => fetchAppointmentData(retryCount - 1), 2000); // Retry after 2 seconds
        } else {
          console.error('Failed after multiple attempts');
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
        const response = await fetch('http://localhost:8000/appointmentAvailableDatesSlots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        if (result.status && result.data?.data?.cartBookableDates) {
          const dates = result.data.data.cartBookableDates.map(slot => slot.date);
          setAvailableDates(dates);
          console.log("Available dates:", dates);
        }

      } catch (error) {
        console.error('Error fetching available dates:', error);
      } finally {
        setIsLoadingDates(false);
      }
    };

    fetchAvailableDates();
  }, [appointmentcartId, aestheticians]);




  const formatDateToString = (date) => {
    return date.toISOString().split('T')[0];
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
        dateString: formatDateToString(dayDate)
      });
    }

    return days;
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };
  // When rendering dates:
  const handleDateClick = async (selectedDate) => {
    console.log("Selected date:", selectedDate);
    if (!selectedDate || !cartId) return;

    // Format the date to 'YYYY-MM-DD'
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
    console.log("Formatted date:", formattedDate);

    setSelectedDate(selectedDate);
    console.log("Selected date:", selectedDate);
    setSelectedTime(''); // Reset selected time when date changes
    setIsLoadingTimeSlots(true);

    try {
      const response = await fetch('http://localhost:8000/appointmentAvailableTimeSlots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: appointmentcartId,
          date: formattedDate, // Use the formatted date here
        }),
      });
      console.log("body sending to api: ", appointmentcartId, formattedDate);
      const result = await response.json();
      console.log("time result:", result);

      if (result.status && result.data?.data?.cartBookableTimes) {
        const timeSlots = result.data.data.cartBookableTimes.map(slot => {
          const startTime = new Date(slot.startTime); // This converts the time with the timezone offset
          return {
            id: slot.id,
            time: startTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Local time zone of user
            })
          };
        });
        setAvailableTimeSlots(timeSlots);
      }
    } catch (error) {
      console.error('Error fetching available time slots:', error);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Split the full name
    const nameParts = firstName.trim().split(' ');

    let updatedFirstName, updatedLastName;

    if (nameParts.length === 1) {
      // If only one word is entered, assign it to both first and last name
      updatedFirstName = nameParts[0] || '';
      updatedLastName = nameParts[0] || ''; // Use the same for last name
    } else {
      // Otherwise, split normally
      updatedFirstName = nameParts[0] || '';
      updatedLastName = nameParts.slice(1).join(' ') || '';
    }

    // Update the state with the new names
    setFirstName(updatedFirstName);
    setLastName(updatedLastName);

    console.log("first name: ", updatedFirstName);
    console.log("last name: ", updatedLastName);

    // Format phone number to digits only and ensure it is in the correct format (+ country code)
    let formattedPhoneNumber = mobile.replace(/[^\d]/g, ''); // Removes anything that's not a number

    // Check if the phone number has the correct length for your country (adjust based on region)
    if (formattedPhoneNumber.length === 10) { // Assuming a local number format
      formattedPhoneNumber = `+1${formattedPhoneNumber}`; // Adding country code for US
    }

    // Check if all personal information fields are filled
    if (!updatedFirstName || !updatedLastName || !email || !mobile) {
      alert('Please fill out all personal information fields.');
      return;
    }

    // Prepare the request body for client creation
    const requestBody = {
      email,
      dob: "1990-01-01",
      externalId: email,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      mobilePhone: formattedPhoneNumber,  // Use the correctly formatted phone number
      pronoun: "Mr/Mrs",
    };
    console.log("request body: ", requestBody);

    try {
      if (isFirstVisit) {
        // For first-time users, create a new client
        // const createClientResponse = await fetch('http://localhost:8000/createClient', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(requestBody),
        // });
        // console.log(createClientResponse);
        // if (!createClientResponse.ok) {
        //   throw new Error('Failed to create client');
        // }

        // const clientData = await createClientResponse.json();
        // console.log("Client created: ", clientData);


        //Client Note
         // For first-time users, create a new client
         const createClientNoteResponse = await fetch('http://localhost:8000/addClientNoteToAppoinmentCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartId: appointmentcartId,
            note: `Type:Digital - Name: ${updatedFirstName} ${updatedLastName} - Email: ${email} - Phone: ${formattedPhoneNumber}`
          }),
        });
        console.log(createClientNoteResponse);
        if (!createClientNoteResponse.ok) {
          throw new Error('Failed to create client');
        }

        const clientNoteData = await createClientNoteResponse.json();
        console.log("Client created: ", clientNoteData);







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

        const clientInfoResponse = await fetch('http://localhost:8000/addClientInfoToAppoinmentCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientInfoRequestBody),
        });

        if (!clientInfoResponse.ok) {
          throw new Error('Failed to add client info to appointment cart');
        }

        const clientInfoData = await clientInfoResponse.json();
        console.log('Client Info response(first time user):', clientInfoData);


        // After client creation, checkout the appointment cart for first-time users
        const checkoutResponse = await fetch('http://localhost:8000/checkoutAppoinmentCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartId: timebookedid,
          }),
        });

        if (!checkoutResponse.ok) {
          throw new Error('Failed to checkout appointment cart for first-time user');
        }

        const checkoutData = await checkoutResponse.json();
        console.log('Checkout response (First-time user):', checkoutData);
      } else {
        // For existing users, just checkout the appointment cart
        const checkoutResponse = await fetch('http://localhost:8000/checkoutAppoinmentCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartId: timebookedid,
          }),
        });

        if (!checkoutResponse.ok) {
          throw new Error('Failed to checkout appointment cart for existing user');
        }

        const checkoutData = await checkoutResponse.json();
        console.log('Checkout response (Existing user):', checkoutData);
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

      const clientInfoResponse = await fetch('http://localhost:8000/addClientInfoToAppoinmentCart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientInfoRequestBody),
      });

      if (!clientInfoResponse.ok) {
        throw new Error('Failed to add client info to appointment cart');
      }

      const clientInfoData = await clientInfoResponse.json();
      console.log('Client Info response:', clientInfoData);

      // If everything is successful, show confirmation and trigger confetti
      setIsConfirmed(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5FD4D0'],
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error processing your appointment. Please try again.');
    }
  };



  const handleTimeSelection = async (time, timeId) => {
    setSelectedTime(time);
    setSelectedTimeId(timeId);
    console.log("Selected time id:", timeId);

    try {
      const response = await fetch('http://localhost:8000/addSelectedTimeToCart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: appointmentcartId,
          bookableTimeId: timeId
        })
      });

      const data = await response.json();
      console.log('Add selected time to cart response:', data);
      console.log("time added id: ", data.data.data.reserveCartBookableItems.cart.id);
      setTimeBookedId(data.data.data.reserveCartBookableItems.cart.id);

      if (!response.ok) {
        throw new Error('Failed to add selected time to cart');
      }
    } catch (error) {
      console.error('Error adding selected time to cart:', error);
      // Optionally reset the selection if the API call fails
      setSelectedTime('');
      setSelectedTimeId('');
    }


  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
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
      setSelectedItemId('');
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
        const response = await fetch('http://localhost:8000/addItemtoAppoinmentCart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartId: cartId,
            itemId: selectedItemId,
            itemStaffVariantId: variantId
          })
        });
        console.log("body sending to api: ", cartId, selectedItemId, variantId);
        const data = await response.json();
        console.log('Add item to cart response:', data);
        if (data.data?.errors && data.data.errors.length > 0 && data.data.errors[0]?.message) {
          setStaffError("This Aesthetician is not available for the selected procedure. Kindly choose another Aesthetician.");
        } else {
          setStaffError("");
          setAppointmentCartId(data.data?.data?.addCartSelectedBookableItem?.cart.id);
        }
        console.log('Appointment cart id:', appointmentcartId);
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
    }
  };



  if (isConfirmed) {
    return (
      <div className="font-sans max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-teal-500">Thank You! We look forward to seeing you:</h1>
        <div className="space-y-4">
          <p>Name:<strong> {firstName} </strong></p>
          <p>Mobile:<strong> {mobile} </strong></p>
          <p>
            {isFirstVisit ? "Initial consultation: " : `Procedure: `}
            <strong>{selectedProcedure}</strong>
          </p>
          {!isFirstVisit && <p>Aesthetician:<strong> {selectedAesthetician} </strong> </p>}
          <p>Date:<strong> {selectedDate?.toLocaleDateString()} </strong> </p>
          <p>Time:<strong> {selectedTime} </strong></p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isSignInOpen && (
        <div className="font-sans fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-10">
          <div className="rounded-lg w-full max-w-md transform transition-all duration-700 scale-0 opacity-0 ease-out"
            style={{
              transition: "transform 0.7s ease-out, opacity 0.7s ease-out",
              transform: isSignInOpen ? 'scale(1)' : 'scale(0)',
              opacity: isSignInOpen ? '1' : '0'
            }}>
            <SignIn
              setClientId={setClientId}
              onClose={() => setIsSignInOpen(false)}
            />
          </div>
        </div>
      )}
      <div className="font-sans min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg space-y-8 p-6">
          <h1 className="text-2xl font-bold text-[#5FD4D0] mb-6 text-center">Let's get you scheduled</h1>

          {isSignedIn ? (
            <h2 className="text-lg font-semibold mb-4 text-center">Welcome!</h2>
          ) : (
            <div ref={firstVisitRef}>
              <h2 className="text-lg font-semibold mb-4">Is this your first visit?</h2>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setIsFirstVisit(true);
                    setIsSignedIn(false);
                    setClientId(null);
                  }}
                  className="bg-teal-500 hover:bg-teal-400 text-white py-2 px-4 rounded"
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
                  className="bg-teal-500 hover:bg-teal-400 text-white py-2 px-4 rounded"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Only show procedure selection after first visit choice is made */}
          {((isFirstVisit === true) || (isFirstVisit === false && clientId)) && (
            <div ref={procedureRef} className="mb-4 transition-opacity duration-500 ease-in-out opacity-100">
              <label htmlFor="procedure" className="text-lg font-semibold mb-2 block">
                Select Procedure
              </label>
              <div className="relative">
                <select
                  id="procedure"
                  value={selectedProcedure}
                  onChange={handleProcedureChange}
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5FD4D0] focus:border-transparent"
                >
                  <option value="">Choose a category</option>
                  {procedures.map((procedure) => (
                    <option key={procedure} value={procedure}>
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
              className={`mb-4 transition-opacity duration-700 ease-in-out ${selectedProcedure ? 'opacity-100' : 'opacity-0'}`}
            >

              {staffError && (
                <div className="text-red-500 text-sm mb-4">
                  {staffError}
                </div>
              )}
              <label htmlFor="aesthetician" className="text-lg font-semibold mb-2 block">
                Select Aesthetician
              </label>
              <div className="relative">
                <select
                  id="aesthetician"
                  value={selectedAesthetician}
                  onChange={handleAestheticianChange}
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5FD4D0] focus:border-transparent"
                >
                  <option value="">Choose a staff</option>
                  {aestheticians.map((aesthetician) => (
                    <option key={aesthetician} value={aesthetician}>
                      {aesthetician}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(selectedProcedure && selectedAesthetician) && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Select Date</h2>

              {/* Month navigation */}
              <div className="flex justify-between items-center mb-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="rounded hover:bg-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-sans text-lg">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="rounded hover:bg-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Days of the week header */}
              <div className="grid grid-cols-7 gap-2 text-center font-semibold mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {getDaysInMonth(currentMonth).map((dayInfo, idx) => (
                  <div key={idx} className="p-1">
                    {dayInfo ? (
                      <button
                        className={`w-[35px] h-[35px] flex items-center justify-center rounded-md 
                ${availableDates.includes(dayInfo.dateString) ? 'font-bold' : ''} 
                ${selectedDate && dayInfo.date.toDateString() === selectedDate.toDateString()
                            ? 'bg-[#5FD4D0] text-white border-[#5FD4D0]'
                            : 'hover:bg-[#cdcdcd] hover:text-white'} 
                ${!availableDates.includes(dayInfo.dateString) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => dayInfo && availableDates.includes(dayInfo.dateString) && handleDateClick(dayInfo.date)}
                      >
                        <span className="border border-gray-400 rounded-md px-2 py-1 hover:border-[#5FD4D0] hover:text-[#5FD4D0] min-w-[35px]">
                          {dayInfo.date.getDate()}
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-300">&nbsp;</span>
                    )}
                  </div>
                ))}
              </div>



              <h2 className="text-lg font-semibold mt-4 mb-2">Select Time</h2>
              <div className="space-y-4">
                {isLoadingTimeSlots ? (
                  <div className="text-center py-4">Loading available times...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleTimeSelection(slot.time, slot.id)}
                        className={`w-full p-2 text-sm rounded-lg transition-colors duration-200
                ${selectedTime === slot.time ? 'bg-[#5FD4D0] text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
                {!isLoadingTimeSlots && availableTimeSlots.length === 0 && selectedDate && (
                  <p className="text-center text-gray-500">No available time slots for this date. Kindly select another date</p>
                )}
              </div>
            </div>
          )}




          {(selectedDate && selectedTime && (isFirstVisit === true || selectedProcedure)) && (
            <div ref={personalInfoRef}>
              <h2 className="text-lg font-semibold mb-2">Enter Your Personal Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(formatPhoneNumber(e.target.value))}
                  className="w-full border border-gray-300 p-2 rounded"
                />

                <button
                  type="submit"
                  className="w-full bg-teal-500 text-white py-2 rounded"
                >
                  Confirm Appointment
                </button>
              </form>

              {/* Real-time display of entered information */}
              <div className="mt-4 p-4  rounded">
                <h3 className="text-lg font-semibold">Your Appointment:</h3>
                <p>Full Name: <strong>{firstName || "Not provided"}</strong></p>
                <p>Email: <strong>{email || "Not provided"}</strong></p>
                <p>Mobile Number: <strong>{mobile || "Not provided"}</strong></p>

              </div>
            </div>

          )}
        </div>
      </div>
    </>
  );
}
