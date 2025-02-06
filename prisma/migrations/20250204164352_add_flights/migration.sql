-- CreateTable
CREATE TABLE "Airlines" (
    "id" SERIAL NOT NULL,
    "iata_code" TEXT NOT NULL,
    "icao_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airports" (
    "id" SERIAL NOT NULL,
    "airport_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flights" (
    "id" SERIAL NOT NULL,
    "flight_number" TEXT NOT NULL,
    "trip_duration" TEXT NOT NULL,
    "number_of_days" TEXT NOT NULL,
    "departure_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "departure_airport_code" TEXT NOT NULL,
    "arrival_airport_code" TEXT NOT NULL,
    "relative_price_feedback" TEXT NOT NULL,
    "final_price" INTEGER NOT NULL,

    CONSTRAINT "Flights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Airlines_iata_code_key" ON "Airlines"("iata_code");

-- CreateIndex
CREATE UNIQUE INDEX "Airlines_icao_code_key" ON "Airlines"("icao_code");

-- CreateIndex
CREATE UNIQUE INDEX "Airports_airport_code_key" ON "Airports"("airport_code");

-- AddForeignKey
ALTER TABLE "Flights" ADD CONSTRAINT "Flights_departure_airport_code_fkey" FOREIGN KEY ("departure_airport_code") REFERENCES "Airports"("airport_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flights" ADD CONSTRAINT "Flights_arrival_airport_code_fkey" FOREIGN KEY ("arrival_airport_code") REFERENCES "Airports"("airport_code") ON DELETE RESTRICT ON UPDATE CASCADE;
